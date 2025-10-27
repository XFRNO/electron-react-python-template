import aiosqlite
import json
from datetime import datetime
from typing import List, Optional
from models import DownloadProgress, DownloadStatus
import os

class DatabaseManager:
    def __init__(self, db_path: Optional[str] = None):
        # If no db_path is provided, check environment variable first, then default
        if db_path is None:
            db_path = os.getenv("DOWNLOADS_DB_PATH")
            if not db_path:
                db_path = "downloads.db"
        self.db_path = db_path

    async def init_database(self):
        """Initialize the database and create tables if they don't exist."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute('''
                CREATE TABLE IF NOT EXISTS downloads (
                    id TEXT PRIMARY KEY,
                    url TEXT NOT NULL,
                    title TEXT,
                    filename TEXT,
                    status TEXT NOT NULL,
                    progress REAL DEFAULT 0.0,
                    downloaded_bytes INTEGER DEFAULT 0,
                    total_bytes INTEGER,
                    speed REAL,
                    eta INTEGER,
                    error_message TEXT,
                    created_at TEXT NOT NULL,
                    completed_at TEXT
                )
            ''')

            # Create settings table for backward compatibility but it won't be used
            await db.execute('''
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
            ''')

            await db.commit()

    async def add_download(self, download: DownloadProgress) -> bool:
        """Add a new download to the database."""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute('''
                    INSERT INTO downloads (
                        id, url, title, filename, status, progress, downloaded_bytes,
                        total_bytes, speed, eta, error_message, created_at, completed_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    download.id, download.url, download.title, download.filename,
                    download.status.value, download.progress, download.downloaded_bytes,
                    download.total_bytes, download.speed, download.eta,
                    download.error_message, download.created_at, download.completed_at
                ))
                await db.commit()
                return True
        except Exception as e:
            print(f"Error adding download: {e}")
            return False

    async def update_download(self, download: DownloadProgress) -> bool:
        """Update an existing download in the database."""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute('''
                    UPDATE downloads SET
                        title = ?, filename = ?, status = ?, progress = ?,
                        downloaded_bytes = ?, total_bytes = ?, speed = ?,
                        eta = ?, error_message = ?, completed_at = ?
                    WHERE id = ?
                ''', (
                    download.title, download.filename, download.status.value,
                    download.progress, download.downloaded_bytes, download.total_bytes,
                    download.speed, download.eta, download.error_message,
                    download.completed_at, download.id
                ))
                await db.commit()
                return True
        except Exception as e:
            print(f"Error updating download: {e}")
            return False

    async def get_download(self, download_id: str) -> Optional[DownloadProgress]:
        """Get a specific download by ID."""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                async with db.execute('SELECT * FROM downloads WHERE id = ?', (download_id,)) as cursor:
                    row = await cursor.fetchone()
                    if row:
                        return self._row_to_download(row)
                    return None
        except Exception as e:
            print(f"Error getting download: {e}")
            return None

    async def get_all_downloads(self) -> List[DownloadProgress]:
        """Get all downloads from the database."""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                async with db.execute('SELECT * FROM downloads ORDER BY created_at DESC') as cursor:
                    rows = await cursor.fetchall()
                    return [self._row_to_download(row) for row in rows]
        except Exception as e:
            print(f"Error getting all downloads: {e}")
            return []

    async def delete_download(self, download_id: str) -> bool:
        """Delete a specific download from the database."""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute('DELETE FROM downloads WHERE id = ?', (download_id,))
                await db.commit()
                return True
        except Exception as e:
            print(f"Error deleting download: {e}")
            return False

    async def delete_all_downloads(self) -> bool:
        """Delete all downloads from the database."""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute('DELETE FROM downloads')
                await db.commit()
                return True
        except Exception as e:
            print(f"Error deleting all downloads: {e}")
            return False

    def _row_to_download(self, row) -> DownloadProgress:
        """Convert database row to DownloadProgress object."""
        return DownloadProgress(
            id=row[0],
            url=row[1],
            title=row[2],
            filename=row[3],
            status=DownloadStatus(row[4]),
            progress=row[5],
            downloaded_bytes=row[6],
            total_bytes=row[7],
            speed=row[8],
            eta=row[9],
            error_message=row[10],
            created_at=row[11],
            completed_at=row[12]
        )
