export type DownloadStatus = 'queued' | 'downloading' | 'paused' | 'completed' | 'error' | 'cancelled';

export interface DownloadProgress {
  id: string;
  url: string;
  title?: string;
  filename?: string;
  status: DownloadStatus;
  progress: number; // 0-100
  downloaded_bytes: number;
  total_bytes?: number;
  speed?: number; // bytes per second
  eta?: number; // seconds
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface DownloadRequest {
  url: string;
  format?: string;
  quality?: string;
  output_path?: string;
  cookies_file?: string;
  cookies_browser?: string;
}

export interface Settings {
  default_output_path: string;
  default_format: string;
  default_quality: string;
  cookies_browser?: string;
  cookies_file?: string;
}