import React, { useState, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";
import { API_CONFIG, testConnection } from "../config/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  const API_URL = API_CONFIG.BASE_URL;

  console.log("AuthContext - Using API_URL:", API_URL);
  console.log(
    "AuthContext - Environment:",
    import.meta.env.MODE || process.env.NODE_ENV
  );

  // Test API connection on startup
  useEffect(() => {
    const checkConnection = async () => {
      console.log("Testing API connection...");
      const result = await testConnection();
      if (!result.success) {
        setConnectionError(`Cannot connect to API: ${result.error}`);
        console.error("API connection test failed:", result.error);
      } else {
        setConnectionError(null);
        console.log("API connection test passed");
      }
    };

    checkConnection();
  }, []);

  // Function to set axios authorization header
  const setAxiosAuthHeader = (authToken) => {
    if (authToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
      console.log("AuthContext - Set axios auth header with token");
    } else {
      delete axios.defaults.headers.common["Authorization"];
      console.log("AuthContext - Removed axios auth header");
    }
  };

  // Set axios base URL
  useEffect(() => {
    axios.defaults.baseURL = API_URL;
    console.log("AuthContext - Set axios base URL to:", API_URL);
  }, [API_URL]);

  // Check if user is logged in on app load
  useEffect(() => {
    const checkAuth = async () => {
      console.log("AuthContext - Checking authentication...");

      const storedToken = localStorage.getItem("token");
      console.log(
        "AuthContext - Stored token:",
        storedToken ? "found" : "not found"
      );

      if (storedToken) {
        // Set the token and axios header immediately
        setToken(storedToken);
        setAxiosAuthHeader(storedToken);

        try {
          console.log("AuthContext - Verifying token with backend...");

          // Add timeout and better error handling
          const response = await axios.get("/api/auth/me", {
            timeout: 10000, // 10 second timeout
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });

          console.log(
            "AuthContext - Token verification successful:",
            response.data
          );
          setUser(response.data.user);
          setConnectionError(null);
        } catch (error) {
          console.error("AuthContext - Error verifying token:", error);

          if (error.code === "ECONNABORTED") {
            setConnectionError(
              "Request timeout - server may be slow to respond"
            );
          } else if (error.message === "Network Error") {
            setConnectionError("Network error - check if server is running");
          } else if (error.response?.status === 401) {
            console.log("AuthContext - Token expired, removing");
          } else {
            setConnectionError(`API Error: ${error.message}`);
          }

          // Token is invalid, remove it
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
          setAxiosAuthHeader(null);
        }
      } else {
        console.log("AuthContext - No stored token found");
      }

      setLoading(false);
      console.log("AuthContext - Authentication check complete");
    };

    // Only check auth if we don't have a connection error
    if (!connectionError) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [API_URL, connectionError]);

  // Set up axios interceptor whenever token changes
  useEffect(() => {
    console.log(
      "AuthContext - Setting up axios interceptor with token:",
      token ? "present" : "null"
    );
    setAxiosAuthHeader(token);
  }, [token]);

  const login = async (email, password) => {
    console.log("AuthContext - Attempting login for:", email);

    try {
      const response = await axios.post(
        "/api/auth/login",
        {
          email,
          password,
        },
        {
          timeout: 10000, // 10 second timeout
        }
      );

      console.log("AuthContext - Login successful:", response.data);

      const { token: newToken, user: userData } = response.data;

      // Set everything immediately and synchronously
      setToken(newToken);
      setUser(userData);
      localStorage.setItem("token", newToken);
      setAxiosAuthHeader(newToken);
      setConnectionError(null);

      console.log("AuthContext - Token and user data stored");

      return { success: true };
    } catch (error) {
      console.error("AuthContext - Login error:", error);

      let errorMessage = "Login failed";

      if (error.code === "ECONNABORTED") {
        errorMessage = "Request timeout - server is not responding";
      } else if (error.message === "Network Error") {
        errorMessage =
          "Cannot connect to server - please check your connection";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const register = async (name, email, password) => {
    console.log("AuthContext - Attempting registration for:", email);

    try {
      const response = await axios.post(
        "/api/auth/register",
        {
          name,
          email,
          password,
        },
        {
          timeout: 10000, // 10 second timeout
        }
      );

      console.log("AuthContext - Registration successful:", response.data);

      const { token: newToken, user: userData } = response.data;

      // Set everything immediately and synchronously
      setToken(newToken);
      setUser(userData);
      localStorage.setItem("token", newToken);
      setAxiosAuthHeader(newToken);
      setConnectionError(null);

      console.log(
        "AuthContext - Token and user data stored after registration"
      );

      return { success: true };
    } catch (error) {
      console.error("AuthContext - Registration error:", error);

      let errorMessage = "Registration failed";

      if (error.code === "ECONNABORTED") {
        errorMessage = "Request timeout - server is not responding";
      } else if (error.message === "Network Error") {
        errorMessage =
          "Cannot connect to server - please check your connection";
      } else if (error.response?.status === 429) {
        errorMessage =
          "Too many registration attempts. Please wait a few minutes before trying again.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const logout = () => {
    console.log("AuthContext - Logging out user");

    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    setAxiosAuthHeader(null);

    console.log("AuthContext - Logout complete");
  };

  const updateProfile = async (name, email) => {
    console.log("AuthContext - Updating profile for:", email);

    try {
      const response = await axios.put("/api/auth/profile", {
        name,
        email,
      });

      console.log("AuthContext - Profile update successful:", response.data);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      console.error("AuthContext - Profile update error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Profile update failed",
      };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    console.log("AuthContext - Changing password");

    try {
      await axios.put("/api/auth/change-password", {
        currentPassword,
        newPassword,
      });

      console.log("AuthContext - Password change successful");
      return { success: true };
    } catch (error) {
      console.error("AuthContext - Password change error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Password change failed",
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    connectionError,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: !!user && !!token,
  };

  console.log("AuthContext - Current state:", {
    user: user ? "present" : "null",
    token: token ? "present" : "null",
    isAuthenticated: !!user && !!token,
    loading,
    connectionError,
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
