import React, { useState, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "./authContext";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use localhost for development, production URL for deployment
  const API_URL =
    //  window.location.hostname === "localhost"
    //  ? "http://localhost:5001/api" :
    "https://taskmanage-ux5k.onrender.com/api";

  console.log("AuthContext - Using API_URL:", API_URL);

  // Set up axios interceptor for token
  useEffect(() => {
    console.log(
      "AuthContext - Setting up axios interceptor with token:",
      token ? "present" : "null"
    );

    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

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
        // Set token first
        setToken(storedToken);

        // Set up axios header immediately
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${storedToken}`;

        try {
          console.log("AuthContext - Verifying token with backend...");
          const response = await axios.get(`${API_URL}/auth/me`);
          console.log(
            "AuthContext - Token verification successful:",
            response.data
          );
          setUser(response.data.user);
        } catch (error) {
          console.error("AuthContext - Error verifying token:", error);
          console.log("AuthContext - Removing invalid token");
          // Token is invalid, remove it
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
          delete axios.defaults.headers.common["Authorization"];
        }
      } else {
        console.log("AuthContext - No stored token found");
      }

      setLoading(false);
      setIsInitialized(true);
      console.log("AuthContext - Authentication check complete");
    };

    checkAuth();
  }, [API_URL]);

  const login = async (email, password) => {
    console.log("AuthContext - Attempting login for:", email);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      console.log("AuthContext - Login successful:", response.data);

      const { token: newToken, user: userData } = response.data;

      // Set token and axios header immediately
      setToken(newToken);
      setUser(userData);
      localStorage.setItem("token", newToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

      console.log("AuthContext - Token and user data stored");

      return { success: true };
    } catch (error) {
      console.error("AuthContext - Login error:", error);

      let errorMessage = "Login failed";

      // Handle different types of errors
      if (error.response?.status === 429) {
        errorMessage =
          "Too many login attempts. Please wait a few minutes before trying again.";
      } else if (error.response?.status === 401) {
        errorMessage = "Invalid email or password";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
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
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
      });

      console.log("AuthContext - Registration successful:", response.data);

      const { token: newToken, user: userData } = response.data;

      // Set token and axios header immediately
      setToken(newToken);
      setUser(userData);
      localStorage.setItem("token", newToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

      console.log(
        "AuthContext - Token and user data stored after registration"
      );

      return { success: true };
    } catch (error) {
      console.error("AuthContext - Registration error:", error);

      let errorMessage = "Registration failed";

      if (error.response?.status === 429) {
        errorMessage =
          "Too many registration attempts. Please wait a few minutes before trying again.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
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
    delete axios.defaults.headers.common["Authorization"];

    console.log("AuthContext - Logout complete");
  };

  const updateProfile = async (name, email) => {
    console.log("AuthContext - Updating profile for:", email);

    try {
      const response = await axios.put(`${API_URL}/auth/profile`, {
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
      await axios.put(`${API_URL}/auth/change-password`, {
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
    isInitialized,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: !!user && !!token && isInitialized,
  };

  console.log("AuthContext - Current state:", {
    user: user ? "present" : "null",
    token: token ? "present" : "null",
    isAuthenticated: !!user && !!token && isInitialized,
    isInitialized,
    loading,
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
