//import required packages
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { createServer } = require("http");
const { Server } = require("socket.io");

//config dotenv
dotenv.config();

//import routes
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const projectRoutes = require("./routes/projects");
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

//security middleware
app.use(helmet());

//rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
});
app.use("/api/", limiter);

//cors middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

//body parser middleware
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));

//connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/task-manager", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => console.error("MongoDB connection error:", error));

//socket.io connection
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) {
    // Verify token
    next();
  } else {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-project", (projectId) => {
    socket.join(`project-${projectId}`);
    console.log(`User ${socket.id} joined project ${projectId}`);
  });

  socket.on("leave-project", (projectId) => {
    socket.leave(`project-${projectId}`);
    console.log(`User ${socket.id} left project ${projectId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// io access to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

//define routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

//health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

//error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "production" ? {} : err.stack,
  });
});

//handle 404 errors
app.use("*", (req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

//start the server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
