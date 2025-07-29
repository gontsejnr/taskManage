import React, { useState, useEffect } from "react";
import axios from "axios";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import ErrorBoundary from "./components/ErrorBoundary";

// API base URL
const API_URL = "https://taskmanage-ux5k.onrender.com/api/tasks";

function App() {
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [serverWaking, setServerWaking] = useState(false);

  // Fetch tasks when component mounts
  useEffect(() => {
    fetchTasks();
  }, []);

  // Enhanced fetch with retry logic for cold starts
  const fetchTasks = async (retryCount = 0) => {
    const maxRetries = 3;

    try {
      setLoading(true);
      setError("");

      // If this is a retry, show server waking message
      if (retryCount > 0) {
        setServerWaking(true);
        setError("Server is waking up, please wait...");
      }

      const response = await axios.get(API_URL, {
        timeout: retryCount > 0 ? 60000 : 10000, // Longer timeout for retries
      });

      // Success
      if (Array.isArray(response.data)) {
        setTasks(response.data);
        setServerWaking(false);
        setError("");
      } else {
        console.warn("API returned non-array data:", response.data);
        setTasks([]);
        setError("Invalid data format received from server");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);

      // Check if it's a network/timeout error and we haven't exhausted retries
      if (
        (error.code === "ECONNABORTED" || error.code === "ERR_NETWORK") &&
        retryCount < maxRetries
      ) {
        console.log(`Retry attempt ${retryCount + 1}/${maxRetries}`);
        setError(
          `Server is starting up... Attempt ${retryCount + 1}/${maxRetries}`
        );

        // Wait before retry (longer each time)
        const delay = (retryCount + 1) * 10000; // 10s, 20s, 30s
        setTimeout(() => {
          fetchTasks(retryCount + 1);
        }, delay);

        return; // Don't set loading to false yet
      }

      // All retries failed or different error
      setTasks([]);
      setServerWaking(false);

      if (error.code === "ERR_NETWORK") {
        setError(
          "Unable to connect to server. The server might be sleeping (Render free tier). Please try refreshing the page in a few minutes."
        );
      } else if (error.code === "ECONNABORTED") {
        setError(
          "Request timed out. The server might be starting up. Please try again."
        );
      } else {
        setError(
          "Failed to fetch tasks. Please check your connection and try again."
        );
      }
    } finally {
      if (retryCount >= maxRetries || !error.includes("starting up")) {
        setLoading(false);
      }
    }
  };

  // Add a manual retry function
  const retryConnection = () => {
    setTasks([]);
    setError("");
    setLoading(true);
    setServerWaking(false);
    fetchTasks();
  };

  // Enhanced request function with retry logic
  const makeRequest = async (requestFn, errorMessage) => {
    try {
      setError("");
      return await requestFn();
    } catch (error) {
      console.error(errorMessage, error);

      if (error.code === "ERR_NETWORK") {
        setError("Server connection lost. Please try again in a moment.");
      } else {
        setError(`${errorMessage} Please try again.`);
      }
      throw error;
    }
  };

  // Add a new task
  const addTask = async (taskData) => {
    await makeRequest(async () => {
      const response = await axios.post(API_URL, taskData);
      if (Array.isArray(tasks)) {
        setTasks([response.data, ...tasks]);
      } else {
        setTasks([response.data]);
      }
    }, "Failed to add task.");
  };

  // Update an existing task
  const updateTask = async (id, taskData) => {
    await makeRequest(async () => {
      const response = await axios.put(`${API_URL}/${id}`, taskData);
      if (Array.isArray(tasks)) {
        setTasks(tasks.map((task) => (task._id === id ? response.data : task)));
      }
      setEditingTask(null);
    }, "Failed to update task.");
  };

  // Delete a task
  const deleteTask = async (id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      await makeRequest(async () => {
        await axios.delete(`${API_URL}/${id}`);
        if (Array.isArray(tasks)) {
          setTasks(tasks.filter((task) => task._id !== id));
        }
      }, "Failed to delete task.");
    }
  };

  // Toggle task completion status
  const toggleComplete = async (id, completed) => {
    await makeRequest(async () => {
      const response = await axios.put(`${API_URL}/${id}`, {
        completed: !completed,
      });
      if (Array.isArray(tasks)) {
        setTasks(tasks.map((task) => (task._id === id ? response.data : task)));
      }
    }, "Failed to update task status.");
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

        {/* Server Status Notice */}
        {serverWaking && (
          <div className="mb-6 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
              Server is waking up from sleep mode. This may take 30-60
              seconds...
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !serverWaking && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              {error.includes("Unable to connect") && (
                <button
                  onClick={retryConnection}
                  className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Retry
                </button>
              )}
            </div>
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
                  <p className="mt-4 text-gray-600">
                    {serverWaking ? "Waking up server..." : "Loading tasks..."}
                  </p>
                  {serverWaking && (
                    <p className="mt-2 text-sm text-gray-500">
                      Free tier servers sleep after inactivity. Please wait...
                    </p>
                  )}
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
          <p className="mt-1"></p>
        </div>
      </div>
    </div>
  );
}

export default App;
