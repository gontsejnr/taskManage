const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5001;

// Validate that PORT is a number
if (isNaN(PORT)) {
  console.error("❌ Invalid PORT value:", PORT);
  process.exit(1);
}

// Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased from 100 to 200 requests per windowMs
  message: {
    message: "Too many requests from this IP. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Auth rate limiting - more lenient for development
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 20 : 100, // Increased limits
  message: {
    message: "Too many authentication attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
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

// CORS Middleware - FIXED VERSION
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "https://task-manage-blue.vercel.app",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      // Add any other domains you need
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  optionsSuccessStatus: 200, // For legacy browser support
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options("*", cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.log("Origin:", req.get("Origin"));
  console.log("User-Agent:", req.get("User-Agent"));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Request body:", JSON.stringify(req.body, null, 2));
  }
  next();
});

// Basic route for testing
app.get("/", (req, res) => {
  res.json({
    message: "Task Management API is running!",
    version: "2.0.0",
    features: ["Authentication", "Task Management", "User Profiles"],
    environment: process.env.NODE_ENV || "development",
    port: PORT,
    timestamp: new Date().toISOString(),
    cors: {
      enabled: true,
      allowedOrigins: [
        "https://task-manage-blue.vercel.app",
        "http://localhost:3000",
      ],
    },
    endpoints: {
      health: "/health",
      auth: "/api/auth/*",
      tasks: "/api/tasks/*",
      authTest: "/api/auth/test",
      taskTest: "/api/tasks/test",
    },
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    port: PORT,
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    cors: "enabled",
  });
});

// API info endpoint
app.get("/api", (req, res) => {
  res.json({
    message: "Task Management API",
    version: "2.0.0",
    cors: {
      status: "enabled",
      allowedOrigins: [
        "https://task-manage-blue.vercel.app",
        "http://localhost:3000",
      ],
    },
    availableEndpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        me: "GET /api/auth/me",
        profile: "PUT /api/auth/profile",
        changePassword: "PUT /api/auth/change-password",
        test: "GET /api/auth/test",
      },
      tasks: {
        getAllTasks: "GET /api/tasks",
        createTask: "POST /api/tasks",
        updateTask: "PUT /api/tasks/:id",
        deleteTask: "DELETE /api/tasks/:id",
        test: "GET /api/tasks/test",
      },
    },
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

// Routes loading
console.log("Loading routes...");

try {
  // Load routes
  const authRoutes = require("./routes/auth");
  const taskRoutes = require("./routes/tasks");

  console.log("Routes loaded successfully");

  // Mount routes
  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/tasks", taskRoutes);

  console.log("Routes mounted successfully");
} catch (error) {
  console.error("❌ Error loading routes:", error);
  console.error("Stack trace:", error.stack);

  // Create fallback routes if main routes fail to load
  app.get("/api/auth/test", (req, res) => {
    res.status(500).json({
      message: "Auth routes failed to load",
      error: error.message,
    });
  });

  app.get("/api/tasks/test", (req, res) => {
    res.status(500).json({
      message: "Task routes failed to load",
      error: error.message,
    });
  });
}

// 404 handler
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      "GET /",
      "GET /health",
      "GET /api",
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET /api/auth/me",
      "GET /api/tasks",
      "POST /api/tasks",
    ],
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);
  console.error("Stack trace:", error.stack);

  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";

  // Handle CORS errors
  if (error.message === "Not allowed by CORS") {
    statusCode = 403;
    message = "Access denied by CORS policy";
  }

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
    ...(process.env.NODE_ENV === "development" && {
      stack: error.stack,
      originalError: error.toString(),
    }),
  });
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

console.log("Connecting to MongoDB...");
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    console.log("Database:", mongoose.connection.name);
    console.log("Connection state:", mongoose.connection.readyState);
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

// ===== CRITICAL: PROPER SERVER STARTUP FOR RENDER =====
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}/`);
  console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 CORS enabled for: https://task-manage-blue.vercel.app`);
  console.log(
    `🚦 Auth rate limit: ${
      process.env.NODE_ENV === "production" ? 20 : 100
    } requests per 15 minutes`
  );
  console.log(`📋 API info: http://0.0.0.0:${PORT}/api`);
  console.log(`🧪 Auth test: http://0.0.0.0:${PORT}/api/auth/test`);
  console.log(`🧪 Tasks test: http://0.0.0.0:${PORT}/api/tasks/test`);

  // Log server address info
  const address = server.address();
  console.log("🔧 Server address info:", address);
});

// Handle server startup errors
server.on("error", (err) => {
  console.error("❌ Server startup error:", err);
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Ensure server closes properly
process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  server.close(() => {
    mongoose.connection.close(() => {
      console.log("Server and database connections closed.");
      process.exit(0);
    });
  });
});
