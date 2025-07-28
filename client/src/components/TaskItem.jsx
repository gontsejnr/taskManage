import React, { useState } from "react";

const TaskItem = ({ task, onEdit, onDelete, onToggleComplete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!task) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">❌ Task data is missing</p>
      </div>
    );
  }

  // Handle toggle completion
  const handleToggleComplete = async () => {
    setIsUpdating(true);
    try {
      await onToggleComplete(task._id);
    } catch (error) {
      console.error("Error toggling task completion:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(task._id);
    } catch (error) {
      console.error("Error deleting task:", error);
      setIsDeleting(false);
    }
  };

  // Format deadline
  const formatDeadline = (deadline) => {
    const date = new Date(deadline);
    if (isNaN(date.getTime())) return "Invalid date";

    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };

    let formattedDate = date.toLocaleDateString("en-US", options);

    if (diffDays < 0) {
      return `${formattedDate} (${Math.abs(diffDays)} days overdue)`;
    } else if (diffDays === 0) {
      return `${formattedDate} (Due today)`;
    } else if (diffDays === 1) {
      return `${formattedDate} (Due tomorrow)`;
    } else {
      return `${formattedDate} (${diffDays} days left)`;
    }
  };

  // Get priority styling
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 border-red-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get priority emoji
  const getPriorityEmoji = (priority) => {
    switch (priority) {
      case "High":
        return "🔴";
      case "Medium":
        return "🟡";
      case "Low":
        return "🟢";
      default:
        return "⚪";
    }
  };

  // Check if task is overdue
  const isOverdue = () => {
    const deadline = new Date(task.deadline);
    const now = new Date();
    return !task.completed && deadline < now;
  };

  return (
    <div
      className={`relative p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
        task.completed
          ? "bg-gray-50 border-gray-200 opacity-75"
          : isOverdue()
          ? "bg-red-50 border-red-200"
          : "bg-white border-gray-200 hover:border-gray-300"
      } ${isDeleting ? "opacity-50" : ""}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3
            className={`text-lg font-semibold ${
              task.completed
                ? "line-through text-gray-500"
                : isOverdue()
                ? "text-red-700"
                : "text-gray-900"
            }`}
          >
            {task.title || "Untitled Task"}
          </h3>

          {task.description && (
            <p
              className={`mt-1 text-sm ${
                task.completed ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {task.description}
            </p>
          )}
        </div>

        {/* Status Badge */}
        <div className="ml-4 flex items-center space-x-2">
          {task.completed && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✅ Completed
            </span>
          )}

          {isOverdue() && !task.completed && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              🚨 Overdue
            </span>
          )}
        </div>
      </div>

      {/* Task Details */}
      <div className="flex items-center justify-between text-sm mb-4">
        <div className="flex items-center space-x-4">
          {/* Priority */}
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityStyle(
              task.priority
            )}`}
          >
            {getPriorityEmoji(task.priority)} {task.priority || "Medium"}
          </span>

          {/* Deadline */}
          <span
            className={`text-xs ${
              isOverdue() && !task.completed
                ? "text-red-600 font-medium"
                : task.completed
                ? "text-gray-400"
                : "text-gray-500"
            }`}
          >
            📅 {formatDeadline(task.deadline)}
          </span>
        </div>

        {/* Created Date */}
        <span className="text-xs text-gray-400">
          Created: {new Date(task.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {/* Complete/Uncomplete Button */}
          <button
            onClick={handleToggleComplete}
            disabled={isUpdating || isDeleting}
            className={`px-3 py-1 rounded-md text-xs font-medium transition duration-200 disabled:opacity-50 ${
              task.completed
                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                : "bg-green-100 text-green-800 hover:bg-green-200"
            }`}
          >
            {isUpdating ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-1 h-3 w-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                ...
              </span>
            ) : task.completed ? (
              "↩️ Mark Pending"
            ) : (
              "✅ Mark Complete"
            )}
          </button>

          {/* Edit Button */}
          <button
            onClick={() => onEdit(task)}
            disabled={isDeleting}
            className="px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-md text-xs font-medium transition duration-200 disabled:opacity-50"
          >
            ✏️ Edit
          </button>
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={isDeleting || isUpdating}
          className="px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 rounded-md text-xs font-medium transition duration-200 disabled:opacity-50"
        >
          {isDeleting ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-1 h-3 w-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Deleting...
            </span>
          ) : (
            "🗑️ Delete"
          )}
        </button>
      </div>

      {/* Progress Indicator for In Progress Tasks */}
      {!task.completed && !isOverdue() && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center text-xs text-gray-500">
            <div className="flex-1 bg-gray-200 rounded-full h-1 mr-2">
              <div className="bg-blue-500 h-1 rounded-full w-0"></div>
            </div>
            <span>In Progress</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskItem;
