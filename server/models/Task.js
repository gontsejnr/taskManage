const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide task title"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "review", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    dueDate: {
      type: Date,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    attachments: [
      {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        text: {
          type: String,
          required: true,
          maxlength: [500, "Comment cannot exceed 500 characters"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    estimatedHours: {
      type: Number,
      min: 0,
    },
    actualHours: {
      type: Number,
      min: 0,
      default: 0,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// update completedAt when status changes to done
taskSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (this.status === "done" && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== "done") {
      this.completedAt = undefined;
    }
  }
  next();
});

// index for better performance
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model("Task", taskSchema);
