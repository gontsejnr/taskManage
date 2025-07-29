export const API_CONFIG = {
  // Better way to determine API URL
  BASE_URL:
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV
      ? "http://localhost:5001"
      : "https://taskmanage-ux5k.onrender.com"),

  endpoints: {
    auth: "/api/auth",
    tasks: "/api/tasks",
    test: "/api/test",
  },
};

// Test function to check API connectivity
export const testConnection = async () => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/test`);
    const data = await response.json();
    console.log("API connection successful:", data);
    return { success: true, data };
  } catch (error) {
    console.error("API connection failed:", error);
    return { success: false, error: error.message };
  }
};
