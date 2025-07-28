const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

// Test route to verify task routes are loaded
router.get("/test", (req, res) => {
  res.json({
    message: "Task routes are working!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// All task routes require authentication
router.use(protect);

// Task CRUD routes
router.route("/").get(getTasks).post(createTask);

router.route("/:id").put(updateTask).delete(deleteTask);

// Debug route to check all registered routes
router.get("/debug/routes", (req, res) => {
  const routes = router.stack.map((layer) => ({
    path: layer.route?.path || "middleware",
    methods: layer.route?.methods || "N/A",
  }));

  res.json({
    message: "Available task routes",
    routes,
    totalRoutes: routes.length,
  });
});

module.exports = router;
