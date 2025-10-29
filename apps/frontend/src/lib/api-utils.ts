// Utility functions for API calls

export async function apiCall(
  endpoint: string,
  options: RequestInit = {},
  onLoading?: (isLoading: boolean) => void,
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) {
  try {
    onLoading?.(true);
    const response = await window.electronAPI.apiCall(endpoint, options);
    onLoading?.(false);
    onSuccess?.(response);
    return response;
  } catch (error) {
    onLoading?.(false);
    onError?.(error);
    console.error("API call failed:", error);
    throw error;
  }
}

// Add more API utility functions as needed
