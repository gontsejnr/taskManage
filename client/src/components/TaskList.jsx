import React, { useState } from "react";

// Temporary TaskItem component to isolate the issue
const TaskItem = ({ task, index, onEdit, onDelete, onToggleComplete }) => {
  console.log("TaskItem received props:", { task, index });

  if (!task) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        Task is null/undefined
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <h3 className="font-medium">{task.title || "No title"}</h3>
      <p className="text-gray-600">{task.description || "No description"}</p>
      <div className="mt-2 flex items-center justify-between">
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            task.priority === "High"
              ? "bg-red-100 text-red-800"
              : task.priority === "Medium"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {task.priority || "No priority"}
        </span>
        <div className="space-x-2">
          <button
            onClick={() =>
              onToggleComplete && onToggleComplete(task._id || task.id)
            }
            className={`px-3 py-1 rounded text-xs ${
              task.completed
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {task.completed ? "Completed" : "Pending"}
          </button>
          <button
            onClick={() => onEdit && onEdit(task)}
            className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete && onDelete(task._id || task.id)}
            className="px-3 py-1 bg-red-500 text-white rounded text-xs"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const TaskList = ({ tasks = [], onEdit, onDelete, onToggleComplete }) => {
  console.log("TaskList received props:", {
    tasks,
    tasksType: typeof tasks,
    isArray: Array.isArray(tasks),
    tasksLength: Array.isArray(tasks) ? tasks.length : "not array",
  });

  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("priority");

  // Filter tasks based on completion status
  const getFilteredTasks = () => {
    console.log("getFilteredTasks called with tasks:", tasks);

    // Ensure tasks is an array before using spread operator
    if (!Array.isArray(tasks)) {
      console.warn("Tasks is not an array in getFilteredTasks:", tasks);
      return [];
    }

    // Now it's safe to spread the array
    let filtered = [...tasks];

    switch (filter) {
      case "completed":
        filtered = filtered.filter((task) => task && task.completed);
        break;
      case "pending":
        filtered = filtered.filter((task) => task && !task.completed);
        break;
      default:
        break;
    }

    console.log("Filtered tasks:", filtered);
    return filtered;
  };

  // Sort tasks based on selected criteria
  const getSortedTasks = (filteredTasks) => {
    console.log("getSortedTasks called with:", filteredTasks);

    if (!Array.isArray(filteredTasks)) {
      console.warn("filteredTasks is not an array:", filteredTasks);
      return [];
    }

    return filteredTasks.sort((a, b) => {
      if (!a || !b) return 0;

      // Always put completed tasks at the bottom
      if (a.completed !== b.completed) {
        return a.completed - b.completed;
      }

      switch (sortBy) {
        case "priority": {
          const priorityOrder = { High: 3, Medium: 2, Low: 1 };
          return (
            (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
          );
        }

        case "deadline": {
          const aDate = new Date(a.deadline);
          const bDate = new Date(b.deadline);
          if (isNaN(aDate.getTime())) return 1;
          if (isNaN(bDate.getTime())) return -1;
          return aDate - bDate;
        }

        case "created": {
          const aDate = new Date(a.createdAt);
          const bDate = new Date(b.createdAt);
          if (isNaN(aDate.getTime())) return 1;
          if (isNaN(bDate.getTime())) return -1;
          return bDate - aDate;
        }

        default:
          return 0;
      }
    });
  };

  const filteredTasks = getFilteredTasks();
  const sortedTasks = getSortedTasks(filteredTasks);

  // Get task statistics
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const totalTasks = safeTasks.length;
  const completedTasks = safeTasks.filter(
    (task) => task && task.completed
  ).length;
  const pendingTasks = totalTasks - completedTasks;
  const overdueTasks = safeTasks.filter((task) => {
    if (!task || !task.deadline) return false;
    const deadline = new Date(task.deadline);
    return (
      !task.completed && !isNaN(deadline.getTime()) && deadline < new Date()
    );
  }).length;

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Debug Info
      <div className="p-4 bg-yellow-50 border-b border-yellow-200">
        <div className="text-sm text-yellow-800">
          <strong>Debug Info:</strong> tasks type: {typeof tasks}, isArray:{" "}
          {Array.isArray(tasks).toString()}, length:{" "}
          {Array.isArray(tasks) ? tasks.length : "N/A"}
        </div>
      </div> */}

      {/* Header with Statistics */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Tasks ({filteredTasks.length})
          </h2>

          {/* Task Statistics */}
          <div className="flex space-x-4 text-sm">
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              📋 Total: {totalTasks}
            </div>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
              ✅ Done: {completedTasks}
            </div>
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
              ⏳ Pending: {pendingTasks}
            </div>
            {overdueTasks > 0 && (
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full">
                🚨 Overdue: {overdueTasks}
              </div>
            )}
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          {/* Filter Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Tasks
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                filter === "pending"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                filter === "completed"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Completed
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="priority">Priority</option>
              <option value="deadline">Deadline</option>
              <option value="created">Date Created</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="p-6">
        {totalTasks === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No tasks yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first task to get started!
            </p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tasks match your filter
            </h3>
            <p className="text-gray-600">
              Try changing the filter or create a new task.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTasks.map((task, index) => (
              <TaskItem
                key={task?._id || task?.id || index}
                task={task}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleComplete={onToggleComplete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;
