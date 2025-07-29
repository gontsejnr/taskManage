const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Task = require("../models/Task");
const { protect } = require("../middleware/auth");

// Apply authentication middleware to all routes
router.use(protect);

// IMPORTANT: Specific routes must come BEFORE parameterized routes
// Get task statistics for authenticated user (must be before /:id route)
router.get("/stats", async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Task.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$completed", true] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$completed", false] }, 1, 0] },
          },
          high: {
            $sum: { $cond: [{ $eq: ["$priority", "High"] }, 1, 0] },
          },
          medium: {
            $sum: { $cond: [{ $eq: ["$priority", "Medium"] }, 1, 0] },
          },
          low: {
            $sum: { $cond: [{ $eq: ["$priority", "Low"] }, 1, 0] },
          },
        },
      },
    ]);

    const result = stats[0] || {
      total: 0,
      completed: 0,
      pending: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching task statistics:", error);
    res.status(500).json({
      message: "Error fetching statistics",
      error: error.message,
    });
  }
});

// Get all tasks for authenticated user
router.get("/", async (req, res) => {
  try {
    const { status, priority, sort } = req.query;
    const filter = { user: req.user.id };

    // Add optional filters
    if (status !== undefined) {
      filter.completed = status === "completed";
    }
    if (priority) {
      filter.priority = priority;
    }

    // Set sort option
    let sortOption = { createdAt: -1 };
    if (sort === "deadline") sortOption = { deadline: 1 };
    if (sort === "priority") {
      // Custom sort for priority (High > Medium > Low)
      sortOption = { priority: -1, createdAt: -1 };
    }

    const tasks = await Task.find(filter).sort(sortOption);

    // Ensure we always return an array
    const tasksArray = Array.isArray(tasks) ? tasks : [];

    console.log(`Found ${tasksArray.length} tasks for user ${req.user.id}`);
    res.json(tasksArray);
  } catch (error) {
    console.error("Error fetching tasks:", error);

    // Return empty array on error instead of error message
    res.status(500).json([]);
  }
});

// Create a new task
router.post("/", async (req, res) => {
  try {
    const { title, description, priority, deadline } = req.body;

    // Basic validation
    if (!title || !deadline) {
      return res.status(400).json({
        message: "Title and deadline are required",
      });
    }

    const task = new Task({
      title,
      description,
      priority,
      deadline: new Date(deadline),
      user: req.user.id, // Associate task with authenticated user
    });

    const savedTask = await task.save();
    console.log(`Created new task: ${savedTask.title} for user ${req.user.id}`);
    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(400).json({
      message: "Error creating task",
      error: error.message,
    });
  }
});

// Get a single task by ID (only if it belongs to the user)
router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({
      message: "Error fetching task",
      error: error.message,
    });
  }
});

// Update a task (only if it belongs to the user)
router.put("/:id", async (req, res) => {
  try {
    const { title, description, priority, deadline, completed } = req.body;

    const updateData = {
      updatedAt: Date.now(),
    };

    // Only update fields that are provided
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (deadline !== undefined) updateData.deadline = new Date(deadline);
    if (completed !== undefined) updateData.completed = completed;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id }, // Only update if task belongs to user
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    console.log(`Updated task: ${task.title} for user ${req.user.id}`);
    res.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(400).json({
      message: "Error updating task",
      error: error.message,
    });
  }
});

// Delete a task (only if it belongs to the user)
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id, // Only delete if task belongs to user
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    console.log(`Deleted task: ${task.title} for user ${req.user.id}`);
    res.json({
      message: "Task deleted successfully",
      deletedTask: task,
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({
      message: "Error deleting task",
      error: error.message,
    });
  }
});

module.exports = router;
