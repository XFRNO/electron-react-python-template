// Utility functions for API calls

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await window.electronAPI.apiCall(endpoint, options);
    return response;
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
}

// Add more API utility functions as needed
