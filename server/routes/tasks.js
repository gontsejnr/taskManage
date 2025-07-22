const express = require("express");
const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const { auth, adminAuth } = require("../middleware/auth");
const {
  validateTask,
  validateComment,
  validateObjectId,
  validatePagination,
} = require("../middleware/validation");
const { logActivity } = require("../middleware/logging");
const { upload } = require("../middleware/upload");

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get user's tasks with pagination and filtering
// @access  Private
router.get("/", auth, validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      project,
      assignedTo,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // build filter query
    const filter = {};

    // user can see tasks they created or are assigned to (unless admin)
    if (req.user.role !== "admin") {
      filter.$or = [{ createdBy: req.user._id }, { assignedTo: req.user._id }];
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (project) filter.project = project;
    if (assignedTo) filter.assignedTo = assignedTo;

    // search in title and description
    if (search) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      });
    }

    // build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // execute query with pagination
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      populate: [
        { path: "assignedTo", select: "name email avatar" },
        { path: "createdBy", select: "name email avatar" },
        { path: "project", select: "name color" },
      ],
    };

    const result = await Task.paginate(filter, options);

    res.json({
      tasks: result.docs,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalTasks: result.totalDocs,
        hasNext: result.hasNextPage,
        hasPrev: result.hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({
      message: "Error retrieving tasks",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get single task by ID
// @access  Private
router.get("/:id", auth, validateObjectId, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("project", "name description color members")
      .populate("comments.user", "name email avatar");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // check if user has permission to view this task
    const hasPermission =
      req.user.role === "admin" ||
      task.createdBy._id.toString() === req.user._id.toString() ||
      task.assignedTo?._id.toString() === req.user._id.toString() ||
      (task.project && task.project.members.includes(req.user._id));

    if (!hasPermission) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ task });
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({
      message: "Error retrieving task",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private
router.post(
  "/",
  auth,
  validateTask,
  logActivity("created", "task"),
  async (req, res) => {
    try {
      const {
        title,
        description,
        priority,
        dueDate,
        assignedTo,
        project,
        tags,
        estimatedHours,
      } = req.body;

      // verify project exists and user has permission
      if (project) {
        const projectDoc = await Project.findById(project);
        if (!projectDoc) {
          return res.status(404).json({ message: "Project not found" });
        }

        const hasProjectPermission =
          req.user.role === "admin" ||
          projectDoc.owner.toString() === req.user._id.toString() ||
          projectDoc.members.includes(req.user._id);

        if (!hasProjectPermission) {
          return res
            .status(403)
            .json({ message: "No permission to create tasks in this project" });
        }
      }

      // verify assigned user exists
      if (assignedTo) {
        const assignedUser = await User.findById(assignedTo);
        if (!assignedUser) {
          return res.status(404).json({ message: "Assigned user not found" });
        }
      }

      const task = new Task({
        title,
        description,
        priority,
        dueDate,
        assignedTo,
        createdBy: req.user._id,
        project,
        tags,
        estimatedHours,
      });

      await task.save();

      const populatedTask = await Task.findById(task._id)
        .populate("assignedTo", "name email avatar")
        .populate("createdBy", "name email avatar")
        .populate("project", "name color");

      // emit real-time update
      if (req.io && project) {
        req.io.to(`project-${project}`).emit("taskCreated", populatedTask);
      }

      res.status(201).json({
        message: "Task created successfully",
        data: populatedTask,
      });
    } catch (error) {
      console.error("Create task error:", error);
      res.status(500).json({
        message: "Error creating task",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put(
  "/:id",
  auth,
  validateObjectId,
  validateTask,
  logActivity("updated", "task"),
  async (req, res) => {
    try {
      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // check permissions
      const hasPermission =
        req.user.role === "admin" ||
        task.createdBy.toString() === req.user._id.toString() ||
        task.assignedTo?.toString() === req.user._id.toString();

      if (!hasPermission) {
        return res.status(403).json({ message: "Access denied" });
      }

      const {
        title,
        description,
        status,
        priority,
        dueDate,
        assignedTo,
        tags,
        estimatedHours,
        actualHours,
      } = req.body;

      // Verify assigned user exists if being updated
      if (assignedTo && assignedTo !== task.assignedTo?.toString()) {
        const assignedUser = await User.findById(assignedTo);
        if (!assignedUser) {
          return res.status(404).json({ message: "Assigned user not found" });
        }
      }

      // Update task fields
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) task.status = status;
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (assignedTo !== undefined) task.assignedTo = assignedTo;
      if (tags !== undefined) task.tags = tags;
      if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
      if (actualHours !== undefined) task.actualHours = actualHours;

      await task.save();

      const updatedTask = await Task.findById(task._id)
        .populate("assignedTo", "name email avatar")
        .populate("createdBy", "name email avatar")
        .populate("project", "name color");

      // emit real-time update
      if (req.io && task.project) {
        req.io.to(`project-${task.project}`).emit("taskUpdated", updatedTask);
      }

      res.json({
        message: "Task updated successfully",
        data: updatedTask,
      });
    } catch (error) {
      console.error("Update task error:", error);
      res.status(500).json({
        message: "Error updating task",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete(
  "/:id",
  auth,
  validateObjectId,
  logActivity("deleted", "task"),
  async (req, res) => {
    try {
      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // check permissions (only creator or admin can delete)
      const hasPermission =
        req.user.role === "admin" ||
        task.createdBy.toString() === req.user._id.toString();

      if (!hasPermission) {
        return res.status(403).json({ message: "Access denied" });
      }

      await Task.findByIdAndDelete(req.params.id);

      // emit real-time update
      if (req.io && task.project) {
        req.io
          .to(`project-${task.project}`)
          .emit("taskDeleted", { id: task._id });
      }

      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Delete task error:", error);
      res.status(500).json({
        message: "Error deleting task",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   POST /api/tasks/:id/comments
// @desc    Add comment to task
// @access  Private
router.post(
  "/:id/comments",
  auth,
  validateObjectId,
  validateComment,
  logActivity("commented", "task"),
  async (req, res) => {
    try {
      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // check if user has permission to comment
      const hasPermission =
        req.user.role === "admin" ||
        task.createdBy.toString() === req.user._id.toString() ||
        task.assignedTo?.toString() === req.user._id.toString();

      if (!hasPermission) {
        return res.status(403).json({ message: "Access denied" });
      }

      const comment = {
        user: req.user._id,
        text: req.body.text,
      };

      task.comments.push(comment);
      await task.save();

      const updatedTask = await Task.findById(task._id).populate(
        "comments.user",
        "name email avatar"
      );

      const newComment = updatedTask.comments[updatedTask.comments.length - 1];

      // Emit real-time update
      if (req.io && task.project) {
        req.io.to(`project-${task.project}`).emit("commentAdded", {
          taskId: task._id,
          comment: newComment,
        });
      }

      res.status(201).json({
        message: "Comment added successfully",
        comment: newComment,
      });
    } catch (error) {
      console.error("Add comment error:", error);
      res.status(500).json({
        message: "Error adding comment",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   PUT /api/tasks/:id/assign
// @desc    Assign task to user
// @access  Private
router.put(
  "/:id/assign",
  auth,
  validateObjectId,
  logActivity("assigned", "task"),
  async (req, res) => {
    try {
      const { assignedTo } = req.body;
      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // check permissions
      const hasPermission =
        req.user.role === "admin" ||
        task.createdBy.toString() === req.user._id.toString();

      if (!hasPermission) {
        return res.status(403).json({ message: "Access denied" });
      }

      // verify assigned user exists
      if (assignedTo) {
        const assignedUser = await User.findById(assignedTo);
        if (!assignedUser) {
          return res.status(404).json({ message: "Assigned user not found" });
        }
      }

      task.assignedTo = assignedTo;
      await task.save();

      const updatedTask = await Task.findById(task._id)
        .populate("assignedTo", "name email avatar")
        .populate("createdBy", "name email avatar")
        .populate("project", "name color");

      // emit real-time update
      if (req.io && task.project) {
        req.io.to(`project-${task.project}`).emit("taskAssigned", updatedTask);
      }

      res.json({
        message: "Task assigned successfully",
        data: updatedTask,
      });
    } catch (error) {
      console.error("Assign task error:", error);
      res.status(500).json({
        message: "Error assigning task",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/tasks/stats/summary
// @desc    Get task statistics for current user
// @access  Private
router.get("/stats/summary", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Task.aggregate([
      {
        $match: {
          $or: [{ createdBy: userId }, { assignedTo: userId }],
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const summary = {
      total: 0,
      todo: 0,
      "in-progress": 0,
      review: 0,
      done: 0,
    };

    stats.forEach((stat) => {
      summary[stat._id] = stat.count;
      summary.total += stat.count;
    });

    // get overdue tasks count
    const overdue = await Task.countDocuments({
      $or: [{ createdBy: userId }, { assignedTo: userId }],
      dueDate: { $lt: new Date() },
      status: { $ne: "done" },
    });

    summary.overdue = overdue;

    res.json({ stats: summary });
  } catch (error) {
    console.error("Get task stats error:", error);
    res.status(500).json({
      message: "Error retrieving task statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
