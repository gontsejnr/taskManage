import React, { useState } from "react";
import TaskItem from "./TaskItem";

const TaskList = ({ tasks, onEdit, onDelete, onToggleComplete }) => {
  const [filter, setFilter] = useState("all"); // all, completed, pending
  const [sortBy, setSortBy] = useState("priority"); // priority, deadline, created

  // Filter tasks based on completion status
  const getFilteredTasks = () => {
    let filtered = [...tasks];

    switch (filter) {
      case "completed":
        filtered = filtered.filter((task) => task.completed);
        break;
      case "pending":
        filtered = filtered.filter((task) => !task.completed);
        break;
      default:
        break;
    }

    return filtered;
  };

  // Sort tasks based on selected criteria
  const getSortedTasks = (filteredTasks) => {
    return filteredTasks.sort((a, b) => {
      // Always put completed tasks at the bottom
      if (a.completed !== b.completed) {
        return a.completed - b.completed;
      }

      switch (sortBy) {
        case "priority": {
          const priorityOrder = { High: 3, Medium: 2, Low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }

        case "deadline":
          return new Date(a.deadline) - new Date(b.deadline);

        case "created":
          return new Date(b.createdAt) - new Date(a.createdAt);

        default:
          return 0;
      }
    });
  };

  const filteredTasks = getFilteredTasks();
  const sortedTasks = getSortedTasks(filteredTasks);

  // Get task statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const overdueTasks = tasks.filter(
    (task) => !task.completed && new Date(task.deadline) < new Date()
  ).length;

  return (
    <div className="bg-white rounded-lg shadow-md">
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

        {/* Progress Bar */}
        {totalTasks > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{Math.round((completedTasks / totalTasks) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

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
          // Empty state
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No tasks yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first task to get started with managing your to-do
              list!
            </p>
            <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Use the form on the left to add a new
                task with a title, description, priority level, and deadline.
              </p>
            </div>
          </div>
        ) : filteredTasks.length === 0 ? (
          // No filtered results
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
          // Task list
          <div className="space-y-3">
            {sortedTasks.map((task, index) => (
              <TaskItem
                key={task._id}
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

      {/* Footer with helpful info */}
      {totalTasks > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {filteredTasks.length} of {totalTasks} tasks
            </div>
            <div className="flex items-center space-x-4">
              <span>🔴 High Priority</span>
              <span>🟡 Medium Priority</span>
              <span>🟢 Low Priority</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
