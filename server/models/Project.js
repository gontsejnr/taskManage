const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide project name"],
      trim: true,
      maxlength: [100, "Project name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["active", "completed", "archived", "on-hold"],
      default: "active",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    color: {
      type: String,
      default: "#3B82F6",
    },
  },
  {
    timestamps: true,
  }
);

// virtual for task count
projectSchema.virtual("taskCount", {
  ref: "Task",
  localField: "_id",
  foreignField: "project",
  count: true,
});

projectSchema.set("toJSON", { virtuals: true });
projectSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Project", projectSchema);
