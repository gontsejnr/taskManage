import React, { useState, useEffect } from "react";

const TaskForm = ({ onSubmit, editingTask, onCancel }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    deadline: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when editing a task
  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title,
        description: editingTask.description || "",
        priority: editingTask.priority,
        deadline: new Date(editingTask.deadline).toISOString().split("T")[0],
      });
    } else {
      // Reset form when not editing
      setFormData({
        title: "",
        description: "",
        priority: "Medium",
        deadline: "",
      });
    }
  }, [editingTask]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.title.trim()) {
      alert("Please enter a task title");
      return;
    }

    if (!formData.deadline) {
      alert("Please select a deadline");
      return;
    }

    // Check if deadline is in the past
    const selectedDate = new Date(formData.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      const confirmPastDate = window.confirm(
        "The selected deadline is in the past. Do you want to continue?"
      );
      if (!confirmPastDate) return;
    }

    setIsSubmitting(true);

    try {
      if (editingTask) {
        await onSubmit(editingTask._id, formData);
      } else {
        await onSubmit(formData);
        // Reset form after successful submission
        setFormData({
          title: "",
          description: "",
          priority: "Medium",
          deadline: "",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: "",
      description: "",
      priority: "Medium",
      deadline: "",
    });
    onCancel();
  };

  // Get tomorrow's date as minimum selectable date
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-fit sticky top-8">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">
        {editingTask ? (
          <span className="flex items-center">
            <span className="text-blue-600">✏️</span>
            <span className="ml-2">Edit Task</span>
          </span>
        ) : (
          <span className="flex items-center">
            <span className="text-green-600">➕</span>
            <span className="ml-2">Add New Task</span>
          </span>
        )}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Task Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            placeholder="Enter task title..."
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.title.length}/100 characters
          </p>
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 resize-none"
            placeholder="Enter task description..."
            rows="4"
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.description.length}/500 characters
          </p>
        </div>

        {/* Priority Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority Level
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          >
            <option value="Low">🟢 Low Priority</option>
            <option value="Medium">🟡 Medium Priority</option>
            <option value="High">🔴 High Priority</option>
          </select>
        </div>

        {/* Deadline Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deadline <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="deadline"
            required
            value={formData.deadline}
            onChange={handleChange}
            min={editingTask ? undefined : getTomorrowDate()}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          />
          {!editingTask && (
            <p className="text-xs text-gray-500 mt-1">Minimum date: Tomorrow</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition duration-200 ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : editingTask
                ? "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
            } text-white focus:outline-none focus:ring-2 focus:ring-offset-2`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                Processing...
              </span>
            ) : editingTask ? (
              "✏️ Update Task"
            ) : (
              "➕ Add Task"
            )}
          </button>

          {editingTask && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50"
            >
              ❌ Cancel
            </button>
          )}
        </div>
      </form>

      {/* Form Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">💡 Tips:</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Keep titles concise and descriptive</li>
          <li>• Use descriptions for additional context</li>
          <li>• Set realistic deadlines to stay motivated</li>
          <li>• Higher priority tasks appear first in the list</li>
        </ul>
      </div>
    </div>
  );
};

export default TaskForm;
