import React, { useState } from "react";
import { useAuth } from "../context/useAuth";

const Register = ({ onToggleMode }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRateLimited, setIsRateLimited] = useState(false);

  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      return "Name is required";
    }

    if (formData.name.length < 2 || formData.name.length > 50) {
      return "Name must be between 2 and 50 characters";
    }

    if (!formData.email) {
      return "Email is required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return "Please enter a valid email address";
    }

    if (!formData.password) {
      return "Password is required";
    }

    if (formData.password.length < 6) {
      return "Password must be at least 6 characters long";
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(formData.password)) {
      return "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setIsRateLimited(false);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    const result = await register(
      formData.name,
      formData.email,
      formData.password
    );

    if (!result.success) {
      // Check if it's a rate limit error
      if (
        result.message.includes("429") ||
        result.message.toLowerCase().includes("rate limit") ||
        result.message.toLowerCase().includes("too many requests")
      ) {
        setIsRateLimited(true);
        setError(
          "Too many registration attempts. Please wait a few minutes before trying again."
        );
      } else {
        setError(result.message);
      }
    }

    setLoading(false);
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (password.length === 0) return { strength: 0, text: "" };

    let score = 0;
    if (password.length >= 6) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    const strengths = [
      { strength: 0, text: "Very Weak", color: "bg-red-500" },
      { strength: 1, text: "Weak", color: "bg-red-400" },
      { strength: 2, text: "Fair", color: "bg-yellow-400" },
      { strength: 3, text: "Good", color: "bg-blue-400" },
      { strength: 4, text: "Strong", color: "bg-green-400" },
      { strength: 5, text: "Very Strong", color: "bg-green-500" },
    ];

    return strengths[score] || strengths[0];
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-green-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl">📝</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join us and start managing your tasks efficiently
          </p>
        </div>

        {/* Rate Limit Warning */}
        {isRateLimited && (
          <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded-md">
            <div className="flex items-center">
              <span className="text-2xl mr-2">⏰</span>
              <div>
                <h3 className="font-medium">Rate Limit Reached</h3>
                <p className="text-sm mt-1">
                  You've made too many registration attempts. Please wait 5-10
                  minutes before trying again, or try logging in if you already
                  have an account.
                </p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div
              className={`border px-4 py-3 rounded-md ${
                isRateLimited
                  ? "bg-orange-100 border-orange-400 text-orange-700"
                  : "bg-red-100 border-red-400 text-red-700"
              }`}
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                disabled={isRateLimited}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                  isRateLimited ? "bg-gray-100 text-gray-500" : ""
                }`}
                placeholder="Enter your full name"
                maxLength="50"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.name.length}/50 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                disabled={isRateLimited}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                  isRateLimited ? "bg-gray-100 text-gray-500" : ""
                }`}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                disabled={isRateLimited}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                  isRateLimited ? "bg-gray-100 text-gray-500" : ""
                }`}
                placeholder="Create a password"
              />
              {formData.password && !isRateLimited && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Password strength:</span>
                    <span
                      className={`font-medium ${
                        passwordStrength.strength >= 3
                          ? "text-green-600"
                          : "text-orange-600"
                      }`}
                    >
                      {passwordStrength.text}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{
                        width: `${(passwordStrength.strength / 5) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isRateLimited}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                  formData.confirmPassword &&
                  formData.password !== formData.confirmPassword
                    ? "border-red-300"
                    : "border-gray-300"
                } ${isRateLimited ? "bg-gray-100 text-gray-500" : ""}`}
                placeholder="Confirm your password"
              />
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword &&
                !isRateLimited && (
                  <p className="text-xs text-red-600 mt-1">
                    Passwords do not match
                  </p>
                )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || isRateLimited}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading || isRateLimited
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              } transition duration-200`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating account...
                </span>
              ) : isRateLimited ? (
                "⏰ Please wait before trying again"
              ) : (
                "🚀 Create Account"
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={onToggleMode}
                className="font-medium text-green-600 hover:text-green-500 transition duration-200"
              >
                Sign in here
              </button>
            </p>
          </div>
        </form>

        <div className="mt-6">
          <div
            className={`rounded-lg p-4 ${
              isRateLimited ? "bg-orange-50" : "bg-green-50"
            }`}
          >
            {isRateLimited ? (
              <>
                <h3 className="text-sm font-medium text-orange-800 mb-2">
                  ⏰ What to do while waiting:
                </h3>
                <ul className="text-xs text-orange-700 space-y-1">
                  <li>
                    • Check if you already have an account and try logging in
                  </li>
                  <li>
                    • Wait 5-10 minutes before attempting registration again
                  </li>
                  <li>• Make sure your email address is correct</li>
                  <li>• Contact support if the issue persists</li>
                </ul>
              </>
            ) : (
              <>
                <h3 className="text-sm font-medium text-green-800 mb-2">
                  📋 Password Requirements:
                </h3>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• At least 6 characters long</li>
                  <li>• Contains uppercase and lowercase letters</li>
                  <li>• Contains at least one number</li>
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
