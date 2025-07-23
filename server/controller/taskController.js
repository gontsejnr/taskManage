const Task = require("../models/Task");

// Get all tasks for authenticated user
exports.getTasks = async (req, res) => {
  try {
    const { status, priority, sort } = req.query;
    const filter = { user: req.user.id };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    let sortOption = { createdAt: -1 };
    if (sort === "deadline") sortOption = { deadline: 1 };
    if (sort === "priority") sortOption = { priority: -1 };

    const tasks = await Task.find(filter).sort(sortOption);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new task
exports.createTask = async (req, res) => {
  try {
    const task = new Task({
      ...req.body,
      user: req.user.id,
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
