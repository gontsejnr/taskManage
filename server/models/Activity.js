const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "created",
        "updated",
        "deleted",
        "assigned",
        "completed",
        "commented",
      ],
    },
    entityType: {
      type: String,
      required: true,
      enum: ["task", "project", "user"],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    entityName: {
      type: String,
      required: true,
    },
    details: {
      type: String,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// index for better performance
activitySchema.index({ createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);
