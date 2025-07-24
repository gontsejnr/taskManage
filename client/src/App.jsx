import React, { useState, useEffect } from "react";
import axios from "axios";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import ErrorBoundary from "./components/ErrorBoundary";

// API base URL - direct connection for Vite
const API_URL = "http://localhost:5001/api/tasks";

function App() {
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch tasks when component mounts
  useEffect(() => {
    fetchTasks();
  }, []);

  // Fetch all tasks from the backend
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(API_URL);

      // Ensure we always set an array
      if (Array.isArray(response.data)) {
        setTasks(response.data);
      } else {
        console.warn("API returned non-array data:", response.data);
        setTasks([]);
        setError("Invalid data format received from server");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]); // Ensure tasks is always an array
      setError(
        "Failed to fetch tasks. Make sure the backend server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // Add a new task
  const addTask = async (taskData) => {
    try {
      setError("");
      const response = await axios.post(API_URL, taskData);

      // Ensure we're working with arrays
      if (Array.isArray(tasks)) {
        setTasks([response.data, ...tasks]);
      } else {
        setTasks([response.data]);
      }
    } catch (error) {
      console.error("Error adding task:", error);
      setError("Failed to add task. Please try again.");
    }
  };

  // Update an existing task
  const updateTask = async (id, taskData) => {
    try {
      setError("");
      const response = await axios.put(`${API_URL}/${id}`, taskData);

      // Ensure we're working with arrays
      if (Array.isArray(tasks)) {
        setTasks(tasks.map((task) => (task._id === id ? response.data : task)));
      }
      setEditingTask(null);
    } catch (error) {
      console.error("Error updating task:", error);
      setError("Failed to update task. Please try again.");
    }
  };

  // Delete a task
  const deleteTask = async (id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        setError("");
        await axios.delete(`${API_URL}/${id}`);

        // Ensure we're working with arrays
        if (Array.isArray(tasks)) {
          setTasks(tasks.filter((task) => task._id !== id));
        }
      } catch (error) {
        console.error("Error deleting task:", error);
        setError("Failed to delete task. Please try again.");
      }
    }
  };

  // Toggle task completion status
  const toggleComplete = async (id, completed) => {
    try {
      setError("");
      const response = await axios.put(`${API_URL}/${id}`, {
        completed: !completed,
      });

      // Ensure we're working with arrays
      if (Array.isArray(tasks)) {
        setTasks(tasks.map((task) => (task._id === id ? response.data : task)));
      }
    } catch (error) {
      console.error("Error updating task:", error);
      setError("Failed to update task status. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Manage Your Tasks
          </h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Task Form */}
          <div className="lg:col-span-1">
            <TaskForm
              onSubmit={editingTask ? updateTask : addTask}
              editingTask={editingTask}
              onCancel={() => setEditingTask(null)}
            />
          </div>

          {/* Task List */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading tasks...</p>
                </div>
              </div>
            ) : (
              <ErrorBoundary>
                <TaskList
                  tasks={Array.isArray(tasks) ? tasks : []}
                  onEdit={setEditingTask}
                  onDelete={deleteTask}
                  onToggleComplete={toggleComplete}
                />
              </ErrorBoundary>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>Built with MERN Stack. ©Gontse Maepa 2025</p>
        </div>
      </div>
    </div>
  );
}

export default App;
