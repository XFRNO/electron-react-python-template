// Type definitions for API responses

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Add more API type definitions as needed
