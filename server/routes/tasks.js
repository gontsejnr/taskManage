const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// Get all tasks
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });

    // Ensure we always return an array
    const tasksArray = Array.isArray(tasks) ? tasks : [];

    console.log(`Found ${tasksArray.length} tasks`);
    res.json(tasksArray);
  } catch (error) {
    console.error("Error fetching tasks:", error);

    // Return empty array on error instead of error message
    res.status(500).json([]);
  }
});

// Get a single task by ID
router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
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
    });

    const savedTask = await task.save();
    console.log("Created new task:", savedTask.title);
    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(400).json({
      message: "Error creating task",
      error: error.message,
    });
  }
});

// Update a task
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

    const task = await Task.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    console.log("Updated task:", task.title);
    res.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(400).json({
      message: "Error updating task",
      error: error.message,
    });
  }
});

// Delete a task
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    console.log("Deleted task:", task.title);
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
