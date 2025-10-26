import yt_dlp
import asyncio
import os
import uuid
import signal
import threading
import time
import concurrent.futures
from datetime import datetime
from typing import Dict, Optional, Callable
from models import DownloadProgress, DownloadStatus, DownloadRequest
from database import DatabaseManager

class DownloadManager:
    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager
        self.active_downloads: Dict[str, Dict] = {}
        self.progress_callbacks: Dict[str, Callable] = {}
        self.download_threads: Dict[str, threading.Thread] = {}
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=3)
        self._shutdown = False
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        # Keep track of yt-dlp instances for forceful termination
        self.yt_dlp_instances: Dict[str, yt_dlp.YoutubeDL] = {}

    # Shared yt-dlp options for browser-like requests
    _BROWSER_LIKE_OPTIONS = {
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'referer': 'https://www.youtube.com/',
        'extractor_retries': 3,
        'fragment_retries': 3,
    }

    def validate_cookies_file(self, cookies_file: str) -> bool:
        """Validate and check cookies file format."""
        if not os.path.exists(cookies_file):
            print(f"Cookies file does not exist: {cookies_file}")
            return False

        try:
            with open(cookies_file, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                lines = content.split('\n')

            # Check if file is empty
            if not content:
                print("Cookies file is empty")
                return False

            # Check for Netscape format header
            if not content.startswith('# Netscape HTTP Cookie File'):
                print("WARNING: Cookies file doesn't have proper Netscape header")
                print("Expected format: # Netscape HTTP Cookie File")

            # Count valid cookie lines (should have 7 tab-separated fields)
            valid_cookies = 0
            for i, line in enumerate(lines):
                line = line.strip()
                if line and not line.startswith('#'):
                    fields = line.split('\t')
                    if len(fields) >= 6:  # At least 6 fields for a valid cookie
                        valid_cookies += 1
                    else:
                        print(f"Invalid cookie line {i+1}: {line[:50]}...")

            print(f"Found {valid_cookies} valid cookies in file")
            return valid_cookies > 0

        except Exception as e:
            print(f"Error validating cookies file: {e}")
            return False

    async def start_download(self, request: DownloadRequest, progress_callback: Optional[Callable] = None) -> str:
        """Start a new download."""
        download_id = str(uuid.uuid4())

        # Store the event loop for thread communication
        if not self._loop:
            self._loop = asyncio.get_event_loop()

        # Create initial download record
        download = DownloadProgress(
            id=download_id,
            url=request.url,
            status=DownloadStatus.QUEUED,
            created_at=datetime.now().isoformat()
        )

        await self.db_manager.add_download(download)

        if progress_callback:
            self.progress_callbacks[download_id] = progress_callback

        # Start download in thread pool to avoid blocking
        future = self.executor.submit(self._download_video_sync, download_id, request)
        self.active_downloads[download_id] = {
            'status': 'queued',
            'future': future,
            'thread_id': threading.get_ident()
        }

        return download_id

    def _download_video_sync(self, download_id: str, request: DownloadRequest):
        """Synchronous download method that runs in a thread."""
        ydl_instance = None
        try:
            # Ensure we have an event loop
            if not self._loop:
                print("No event loop available")
                return

            # Mark as downloading
            download = asyncio.run_coroutine_threadsafe(
                self.db_manager.get_download(download_id), self._loop
            ).result()

            if not download:
                return

            print(f"Settings loaded: output_path={request.output_path}")

            # Update status to downloading
            download.status = DownloadStatus.DOWNLOADING
            asyncio.run_coroutine_threadsafe(
                self.db_manager.update_download(download), self._loop
            ).result()

            # Update active downloads
            if download_id in self.active_downloads:
                self.active_downloads[download_id]['status'] = 'downloading'

            # Prepare yt-dlp options
            # Use the output_path from the request, or default to user's Downloads folder
            output_path = request.output_path or os.path.expanduser('~/Downloads')

            # Log request parameters for debugging
            print(f"Download request - Quality: {request.quality}, Format: {request.format}")

            def progress_hook(d):
                """Progress hook that runs in the download thread."""
                # Check if download has been cancelled or paused
                if self._shutdown or download_id not in self.active_downloads:
                    # This will cause yt-dlp to stop the download
                    raise Exception("Download cancelled or paused")

                # Check if the download status has changed to paused or cancelled
                if self._loop:  # Add null check
                    try:
                        current_download = asyncio.run_coroutine_threadsafe(
                            self.db_manager.get_download(download_id), self._loop
                        ).result()
                        if current_download and current_download.status in [DownloadStatus.PAUSED, DownloadStatus.CANCELLED]:
                            raise Exception(f"Download {current_download.status}")
                    except Exception:
                        # If we can't get the download status, assume it's cancelled
                        raise Exception("Download cancelled")

                try:
                    # Schedule progress update on the main event loop
                    if self._loop:  # Add null check
                        asyncio.run_coroutine_threadsafe(
                            self._progress_hook_async(download_id, d), self._loop
                        )
                except Exception as e:
                    print(f"Error scheduling progress hook: {e}")

            ydl_opts = {
                'outtmpl': os.path.join(output_path, '%(title)s.%(ext)s'),
                'progress_hooks': [progress_hook],
            }

            # Add browser-like options
            ydl_opts.update(self._BROWSER_LIKE_OPTIONS)

            # Build format string based on user selections - using known working patterns
            if request.quality == "best":
                if request.format:
                    format_string = f"best[ext={request.format}]/best"
                else:
                    format_string = "best"
            elif request.quality == "worst":
                if request.format:
                    format_string = f"worst[ext={request.format}]/worst"
                else:
                    format_string = "worst"
            else:
                # For specific resolutions like 1080p, 720p, etc.
                # Use yt-dlp's format specification that's known to work
                if request.format:
                    # Try resolution+format first, then resolution, then format, then best
                    format_string = f"{request.quality}[ext={request.format}]/{request.quality}/best[ext={request.format}]/best"
                else:
                    # Try resolution first, then best
                    format_string = f"{request.quality}/best"

            ydl_opts['format'] = format_string

            # Log detailed format selection info
            print(f"User selection - Quality: {request.quality}, Format: {request.format}")
            print(f"Generated format string: {format_string}")

            # Add some format validation
            print(f"Format string components:")
            print(f"  Requested quality: {request.quality}")
            print(f"  Requested format: {request.format}")

            # Add cookies if the cookies file exists
            # Try to get cookies path from environment variable first
            cookies_file = os.getenv("COOKIES_PATH")

            if not cookies_file:
                # Fallback to default location
                cookies_file = os.path.join(os.path.dirname(__file__), "user-downloaded-cookies.txt")

            if os.path.exists(cookies_file) and self.validate_cookies_file(cookies_file):
                ydl_opts['cookiefile'] = cookies_file
            else:
                print("No valid cookies file found, proceeding without cookies")

            # Download the video
            print(f"Starting download with thread ID: {threading.get_ident()}")

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl_instance = ydl
                # Store the yt-dlp instance for potential forceful termination
                self.yt_dlp_instances[download_id] = ydl

                if self._shutdown:
                    return

                # Extract info first
                info = ydl.extract_info(request.url, download=False)
                if info:
                    download.title = info.get('title', 'Unknown')
                    # Log some basic info about what we extracted
                    print(f"Video title: {info.get('title', 'Unknown')}")
                    print(f"Video duration: {info.get('duration', 'Unknown')} seconds")
                    if 'formats' in info:
                        print(f"Total available formats: {len(info['formats'])}")
                        # Show a few sample formats
                        sample_formats = info['formats'][-5:] if len(info['formats']) > 5 else info['formats']
                        print("Sample formats:")
                        for fmt in sample_formats:
                            print(f"  ID: {fmt.get('format_id', 'N/A')}, Ext: {fmt.get('ext', 'N/A')}, Res: {fmt.get('resolution', 'N/A')}, Height: {fmt.get('height', 'N/A')}")
                asyncio.run_coroutine_threadsafe(
                    self.db_manager.update_download(download), self._loop
                ).result()

                if self._shutdown or download_id not in self.active_downloads:
                    return

                # Start actual download
                ydl.download([request.url])

                # Log the format that was actually used
                if info and 'requested_downloads' in info:
                    for download_info in info.get('requested_downloads', []):
                        format_id = download_info.get('format_id', 'unknown')
                        ext = download_info.get('ext', 'unknown')
                        resolution = download_info.get('resolution', 'unknown')
                        print(f"Actually downloaded format: {format_id} ({ext}) at {resolution}")
                elif hasattr(ydl, '_download_retcode') and ydl._download_retcode is not None:
                    print(f"Download completed with retcode: {ydl._download_retcode}")

            # Mark as completed
            if not self._shutdown and download_id in self.active_downloads:
                download.status = DownloadStatus.COMPLETED
                download.progress = 100.0
                download.completed_at = datetime.now().isoformat()
                asyncio.run_coroutine_threadsafe(
                    self.db_manager.update_download(download), self._loop
                ).result()
                print(f"Download {download_id} completed successfully")

        except Exception as e:
            # Check if this is a cancellation or pause exception
            if "Download cancelled" in str(e) or "Download paused" in str(e):
                print(f"Download {download_id} was cancelled or paused: {e}")
                # The status should already be set in the pause/cancel methods
                return
            else:
                print(f"Download failed with error: {e}")
                # Create a user-friendly error message
                error_message = str(e)

                # Check for YouTube age restriction error and provide a friendly message
                if "Sign in to confirm your age" in error_message and ("youtube" in request.url.lower() or "[youtube]" in error_message):
                    user_friendly_message = "This video requires authentication. Please add your YouTube cookies in the Settings > Authentication section to download age-restricted content."
                else:
                    user_friendly_message = error_message

                # Mark as error
                try:
                    if self._loop:  # Check if loop is available
                        download = asyncio.run_coroutine_threadsafe(
                            self.db_manager.get_download(download_id), self._loop
                        ).result()
                        if download:
                            download.status = DownloadStatus.ERROR
                            download.error_message = user_friendly_message
                            asyncio.run_coroutine_threadsafe(
                                self.db_manager.update_download(download), self._loop
                            ).result()
                except Exception as update_error:
                    print(f"Failed to update error status: {update_error}")
        finally:
            # Clean up
            if download_id in self.active_downloads:
                del self.active_downloads[download_id]
            if download_id in self.progress_callbacks:
                del self.progress_callbacks[download_id]
            if download_id in self.yt_dlp_instances:
                del self.yt_dlp_instances[download_id]
            print(f"Cleanup completed for download {download_id}")

    async def _progress_hook_async(self, download_id: str, d):
        """Handle progress updates from yt-dlp - called from thread."""
        try:
            download = await self.db_manager.get_download(download_id)
            if not download:
                print(f"No download found for ID: {download_id}")
                return

            if d['status'] == 'downloading':
                download.filename = d.get('filename', '')
                download.downloaded_bytes = d.get('downloaded_bytes', 0)
                download.total_bytes = d.get('total_bytes') or d.get('total_bytes_estimate')
                download.speed = d.get('speed')

                # Convert float ETA to integer
                eta_value = d.get('eta')
                if eta_value is not None:
                    download.eta = int(eta_value) if isinstance(eta_value, (int, float)) else None
                else:
                    download.eta = None

                if download.total_bytes:
                    download.progress = (download.downloaded_bytes / download.total_bytes) * 100
                else:
                    download.progress = 0

                await self.db_manager.update_download(download)
                print(f"Progress updated: {download.progress:.2f}% - {download.downloaded_bytes}/{download.total_bytes} bytes")

                # Call progress callback if available
                if download_id in self.progress_callbacks:
                    callback = self.progress_callbacks[download_id]
                    try:
                        await callback(download)
                        print(f"Progress callback sent for download {download_id}")
                    except Exception as cb_error:
                        print(f"Error in progress callback: {cb_error}")
                else:
                    print(f"No progress callback found for download {download_id}")
        except Exception as e:
            print(f"Error in progress hook: {e}")

    async def cancel_download(self, download_id: str) -> bool:
        """Cancel an active download."""
        download = await self.db_manager.get_download(download_id)
        if download:
            download.status = DownloadStatus.CANCELLED
            await self.db_manager.update_download(download)

            # Cancel the future if it exists
            if download_id in self.active_downloads:
                download_info = self.active_downloads[download_id]
                if 'future' in download_info:
                    download_info['future'].cancel()
                # Remove from active downloads to signal the thread to stop
                del self.active_downloads[download_id]

            # Remove from progress callbacks
            if download_id in self.progress_callbacks:
                del self.progress_callbacks[download_id]

            # Remove yt-dlp instance reference
            if download_id in self.yt_dlp_instances:
                try:
                    # This is a workaround - yt-dlp doesn't have a direct way to terminate
                    # We'll rely on the future cancellation and thread cleanup
                    del self.yt_dlp_instances[download_id]
                except Exception as e:
                    print(f"Error terminating yt-dlp instance: {e}")

            print(f"Download {download_id} cancelled")
            return True
        return False

    async def pause_download(self, download_id: str) -> bool:
        """Pause an active download."""
        download = await self.db_manager.get_download(download_id)
        if download:
            # Set status to paused
            download.status = DownloadStatus.PAUSED
            await self.db_manager.update_download(download)

            # Cancel the future if it exists (similar to cancel)
            if download_id in self.active_downloads:
                download_info = self.active_downloads[download_id]
                if 'future' in download_info:
                    download_info['future'].cancel()
                # Remove from active downloads to signal the thread to stop
                del self.active_downloads[download_id]

            # Remove from progress callbacks
            if download_id in self.progress_callbacks:
                del self.progress_callbacks[download_id]

            # Remove yt-dlp instance reference
            if download_id in self.yt_dlp_instances:
                try:
                    # This is a workaround - yt-dlp doesn't have a direct way to terminate
                    # We'll rely on the future cancellation and thread cleanup
                    del self.yt_dlp_instances[download_id]
                except Exception as e:
                    print(f"Error terminating yt-dlp instance: {e}")

            print(f"Download {download_id} paused")
            return True
        return False

    async def resume_interrupted_download(self, download_id: str, request: DownloadRequest, progress_callback: Optional[Callable] = None) -> bool:
        """Resume an interrupted download using the existing download ID."""
        # Get the existing download
        download = await self.db_manager.get_download(download_id)
        if not download:
            print(f"Download {download_id} not found")
            return False

        # Check if it's actually interrupted (downloading or queued with progress)
        if download.status not in [DownloadStatus.DOWNLOADING, DownloadStatus.QUEUED]:
            print(f"Download {download_id} is not interrupted (status: {download.status})")
            return False

        # Update the download status to QUEUED
        download.status = DownloadStatus.QUEUED
        # Keep the existing progress and other data
        await self.db_manager.update_download(download)

        # Store the event loop for thread communication
        if not self._loop:
            self._loop = asyncio.get_event_loop()

        if progress_callback:
            self.progress_callbacks[download_id] = progress_callback

        # Start download in thread pool to avoid blocking
        future = self.executor.submit(self._download_video_sync, download_id, request)
        self.active_downloads[download_id] = {
            'status': 'queued',
            'future': future,
            'thread_id': threading.get_ident()
        }

        print(f"Interrupted download {download_id} resumed")
        return True

    async def resume_download(self, download_id: str, request: DownloadRequest, progress_callback: Optional[Callable] = None) -> bool:
        """Resume a paused download."""
        # Get the existing download
        download = await self.db_manager.get_download(download_id)
        if not download:
            print(f"Download {download_id} not found")
            return False

        # Check if it's actually paused
        if download.status != DownloadStatus.PAUSED:
            print(f"Download {download_id} is not paused (status: {download.status})")
            return False

        # Update the download status to QUEUED
        download.status = DownloadStatus.QUEUED
        await self.db_manager.update_download(download)

        # Store the event loop for thread communication
        if not self._loop:
            self._loop = asyncio.get_event_loop()

        if progress_callback:
            self.progress_callbacks[download_id] = progress_callback

        # Start download in thread pool to avoid blocking
        future = self.executor.submit(self._download_video_sync, download_id, request)
        self.active_downloads[download_id] = {
            'status': 'queued',
            'future': future,
            'thread_id': threading.get_ident()
        }

        print(f"Paused download {download_id} resumed")
        return True

    async def resume_downloads_on_startup(self):
        """Resume any downloads that were interrupted when the app was closed."""
        downloads = await self.db_manager.get_all_downloads()

        # Handle interrupted downloads (those that were actually started but interrupted)
        # This includes downloads that were actively downloading and queued downloads with progress > 0
        interrupted_downloads = [
            d for d in downloads
            if d.status == DownloadStatus.DOWNLOADING or
               (d.status == DownloadStatus.QUEUED and d.progress > 0)
        ]

        # Handle truly queued downloads (never started, 0 progress)
        truly_queued_downloads = [
            d for d in downloads
            if d.status == DownloadStatus.QUEUED and d.progress == 0
        ]

        # Handle paused downloads - they should remain paused
        paused_downloads = [
            d for d in downloads
            if d.status == DownloadStatus.PAUSED
        ]

        # Handle cancelled and completed downloads - they should remain as-is
        cancelled_downloads = [
            d for d in downloads
            if d.status == DownloadStatus.CANCELLED
        ]

        completed_downloads = [
            d for d in downloads
            if d.status == DownloadStatus.COMPLETED
        ]

        # Handle error downloads - they should remain as-is
        error_downloads = [
            d for d in downloads
            if d.status == DownloadStatus.ERROR
        ]

        print(f"Found {len(interrupted_downloads)} interrupted downloads to resume")
        print(f"Found {len(truly_queued_downloads)} truly queued downloads to keep queued")
        print(f"Found {len(paused_downloads)} paused downloads to keep paused")
        print(f"Found {len(cancelled_downloads)} cancelled downloads to keep as-is")
        print(f"Found {len(completed_downloads)} completed downloads to keep as-is")
        print(f"Found {len(error_downloads)} error downloads to keep as-is")

        # Resume interrupted downloads using existing download IDs
        for download in interrupted_downloads:
            # Instead of using settings_manager, we'll create a download request with default values
            # The frontend will send the proper settings when initiating new downloads
            request = DownloadRequest(
                url=download.url,
                format="mp4",  # Default format
                quality="best",  # Default quality
                output_path=None  # Will use the system default
            )

            # Resume the existing interrupted download
            success = await self.resume_interrupted_download(
                download.id,
                request
            )

            if success:
                print(f"Resumed download: {download.title or download.url}")
            else:
                print(f"Failed to resume download: {download.title or download.url}")

        # Keep other downloads in their current state (no action needed)
        for download in truly_queued_downloads:
            print(f"Keeping download queued: {download.title or download.url}")

        for download in paused_downloads:
            print(f"Keeping download paused: {download.title or download.url}")

        for download in cancelled_downloads:
            print(f"Keeping download cancelled: {download.title or download.url}")

        for download in completed_downloads:
            print(f"Keeping download completed: {download.title or download.url}")

        for download in error_downloads:
            print(f"Keeping download in error state: {download.title or download.url}")

    async def cancel_all_downloads(self):
        """Cancel all active downloads and shutdown gracefully."""
        print("Cancelling all active downloads...")
        self._shutdown = True

        # Cancel all active downloads
        for download_id in list(self.active_downloads.keys()):
            await self.cancel_download(download_id)

        # Shutdown the executor
        self.executor.shutdown(wait=False)

        print("All downloads cancelled")

    async def get_video_formats(self, url: str):
        """Get available formats for a video without downloading."""
        try:
            # Prepare yt-dlp options for format extraction
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'simulate': True,  # Don't download, just extract info
            }

            # Add browser-like options
            ydl_opts.update(self._BROWSER_LIKE_OPTIONS)

            # Add cookies if the cookies file exists
            # Try to get cookies path from environment variable first
            cookies_file = os.getenv("COOKIES_PATH")

            if not cookies_file:
                # Fallback to default location
                cookies_file = os.path.join(os.path.dirname(__file__), "user-downloaded-cookies.txt")

            if os.path.exists(cookies_file) and self.validate_cookies_file(cookies_file):
                ydl_opts['cookiefile'] = cookies_file
            else:
                print("No valid cookies file found, proceeding without cookies")

            # Extract info without downloading
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)

                # Check if info is valid
                if not info:
                    raise Exception("Failed to extract video information")

                # Ensure info is a dictionary
                if not isinstance(info, dict):
                    raise Exception("Invalid video information format")

                # Extract formats from the info
                formats = []
                if 'formats' in info and isinstance(info['formats'], list):
                    for fmt in info['formats']:
                        if isinstance(fmt, dict):
                            # Include all available formats
                            format_info = {
                                'format_id': fmt.get('format_id', 'unknown'),
                                'ext': fmt.get('ext', 'unknown'),
                                'resolution': fmt.get('resolution', 'unknown'),
                                'height': fmt.get('height', 0) or 0,
                                'width': fmt.get('width', 0) or 0,
                                'filesize': fmt.get('filesize', 0) or 0,
                                'fps': fmt.get('fps', 0) or 0,
                                'vcodec': fmt.get('vcodec', 'unknown'),
                                'acodec': fmt.get('acodec', 'unknown'),
                                'abr': fmt.get('abr', 0) or 0,  # Audio bitrate
                                'tbr': fmt.get('tbr', 0) or 0,  # Total bitrate
                                'quality': fmt.get('quality', 0) or 0,
                                'format_note': fmt.get('format_note', ''),
                            }
                            formats.append(format_info)

                # Sort formats by quality (height) descending, handling None values
                formats.sort(key=lambda x: x['height'] if x['height'] is not None else 0, reverse=True)

                # Return video title and formats
                return {
                    'title': info.get('title', 'Unknown'),
                    'duration': info.get('duration', 0) or 0,
                    'formats': formats
                }
        except Exception as e:
            print(f"Error extracting video formats: {e}")
            # Check for YouTube age restriction error and provide a friendly message
            error_message = str(e)
            if "Sign in to confirm your age" in error_message:
                user_friendly_message = "This video requires authentication. Please add your YouTube cookies in the Settings > Authentication section to view formats for age-restricted content."
            else:
                user_friendly_message = f"Failed to extract video formats: {error_message}"
            raise Exception(user_friendly_message)
