const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

// Security Middleware
app.use(helmet());

// General rate limiting - more lenient
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased from 100 to 200 requests per windowMs
  message: {
    message: "Too many requests from this IP. Please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Auth rate limiting - more lenient for development
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 10 : 50, // 50 for dev, 10 for production
  message: {
    message: "Too many authentication attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for certain IPs during development
  skip: (req) => {
    // Skip rate limiting for localhost during development
    if (
      process.env.NODE_ENV !== "production" &&
      (req.ip === "127.0.0.1" ||
        req.ip === "::1" ||
        req.ip.includes("localhost"))
    ) {
      return true;
    }
    return false;
  },
});

// CORS Middleware
app.use(
  cors({
    origin: [
      "https://taskmanage-ux5k.onrender.com",
      "http://localhost:3000", // Add localhost for development
      "http://localhost:5173", // Add Vite default port
    ],
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Basic route for testing
app.get("/", (req, res) => {
  res.json({
    message: "Task Management API is running!",
    version: "2.0.0",
    features: ["Authentication", "Task Management", "User Profiles"],
    environment: process.env.NODE_ENV || "development",
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Rate limit info endpoint for debugging
app.get("/api/rate-limit-info", (req, res) => {
  res.json({
    message: "Rate limit information",
    ip: req.ip,
    environment: process.env.NODE_ENV || "development",
    authLimitConfig: {
      windowMs: "15 minutes",
      max: process.env.NODE_ENV === "production" ? 10 : 50,
      skipLocalhost: process.env.NODE_ENV !== "production",
    },
  });
});

// Routes - Make sure these are defined correctly
try {
  app.use("/api/auth", authLimiter, require("./routes/auth"));
  app.use("/api/tasks", require("./routes/tasks"));
} catch (error) {
  console.error("Error loading routes:", error);
  process.exit(1);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);

  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";

  // Handle mongoose validation errors
  if (error.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(error.errors)
      .map((err) => err.message)
      .join(", ");
  }

  // Handle mongoose duplicate key errors
  if (error.code === 11000) {
    statusCode = 400;
    message = "Duplicate field value entered";
  }

  // Handle JWT errors
  if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});

// Environment variables validation
const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
  process.exit(1);
}

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    console.log("Database:", mongoose.connection.name);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed.");
    process.exit(0);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}/`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🚦 Auth rate limit: ${
      process.env.NODE_ENV === "production" ? 10 : 50
    } requests per 15 minutes`
  );
});
