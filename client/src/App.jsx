import React, { useState, useEffect } from "react";
import axios from "axios";
import { AuthProvider } from "./context/AuthProvider";
import { useAuth } from "./context/useAuth";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./components/Login";
import Register from "./components/Register";
import Profile from "./components/Profile";

const MainApp = () => {
  const {
    user,
    loading: authLoading,
    isAuthenticated,
    isInitialized,
    logout,
  } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authMode, setAuthMode] = useState("login"); // 'login' or 'register'
  const [showProfile, setShowProfile] = useState(false);

  // Use localhost for development, production URL for deployment
  const API_URL =
    //  window.location.hostname === "localhost"
    //  ? "http://localhost:5001/api/tasks" :
    "https://taskmanage-ux5k.onrender.com/api/tasks";

  // Handle 401 errors by logging out the user
  const handle401Error = () => {
    console.log("MainApp - Handling 401 error, logging out user");
    logout();
    setError("Your session has expired. Please log in again.");
  };

  // Fetch tasks when user is authenticated AND context is initialized
  useEffect(() => {
    console.log(
      "MainApp - useEffect triggered, isAuthenticated:",
      isAuthenticated,
      "isInitialized:",
      isInitialized
    );

    if (isAuthenticated && isInitialized) {
      fetchTasks();
    } else {
      console.log(
        "MainApp - User not authenticated or not initialized, clearing tasks"
      );
      setTasks([]);
      setLoading(false);
    }
  }, [isAuthenticated, isInitialized]); // Add isInitialized to dependencies

  // Fetch all tasks from the backend
  const fetchTasks = async () => {
    console.log("MainApp - Fetching tasks...");

    try {
      setLoading(true);
      setError("");

      // Check if we have authorization header
      const authHeader = axios.defaults.headers.common["Authorization"];
      console.log(
        "MainApp - Authorization header:",
        authHeader ? "present" : "missing"
      );

      const response = await axios.get(API_URL);
      console.log("MainApp - Fetch tasks successful:", response.data);

      // Ensure we always set an array
      if (Array.isArray(response.data)) {
        setTasks(response.data);
      } else {
        console.warn("MainApp - API returned non-array data:", response.data);
        setTasks([]);
        setError("Invalid data format received from server");
      }
    } catch (error) {
      console.error("MainApp - Error fetching tasks:", error);
      console.error("MainApp - Error response:", error.response);

      setTasks([]);

      if (error.response?.status === 401) {
        console.log("MainApp - 401 error detected");
        handle401Error();
      } else {
        setError("Failed to fetch tasks. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Add a new task
  const addTask = async (taskData) => {
    console.log("MainApp - Adding task:", taskData);

    try {
      setError("");
      const response = await axios.post(API_URL, taskData);
      console.log("MainApp - Add task successful:", response.data);

      if (Array.isArray(tasks)) {
        setTasks([response.data, ...tasks]);
      } else {
        setTasks([response.data]);
      }
    } catch (error) {
      console.error("MainApp - Error adding task:", error);
      if (error.response?.status === 401) {
        handle401Error();
      } else {
        setError("Failed to add task. Please try again.");
      }
    }
  };

  // Update an existing task
  const updateTask = async (id, taskData) => {
    console.log("MainApp - Updating task:", id, taskData);

    try {
      setError("");
      const response = await axios.put(`${API_URL}/${id}`, taskData);
      console.log("MainApp - Update task successful:", response.data);

      if (Array.isArray(tasks)) {
        setTasks(tasks.map((task) => (task._id === id ? response.data : task)));
      }
      setEditingTask(null);
    } catch (error) {
      console.error("MainApp - Error updating task:", error);
      if (error.response?.status === 401) {
        handle401Error();
      } else {
        setError("Failed to update task. Please try again.");
      }
    }
  };

  // Delete a task
  const deleteTask = async (id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      console.log("MainApp - Deleting task:", id);

      try {
        setError("");
        await axios.delete(`${API_URL}/${id}`);
        console.log("MainApp - Delete task successful");

        if (Array.isArray(tasks)) {
          setTasks(tasks.filter((task) => task._id !== id));
        }
      } catch (error) {
        console.error("MainApp - Error deleting task:", error);
        if (error.response?.status === 401) {
          handle401Error();
        } else {
          setError("Failed to delete task. Please try again.");
        }
      }
    }
  };

  // Toggle task completion status
  const toggleComplete = async (id) => {
    const task = tasks.find((t) => t._id === id);
    if (!task) return;

    console.log("MainApp - Toggling task completion:", id, !task.completed);

    try {
      setError("");
      const response = await axios.put(`${API_URL}/${id}`, {
        completed: !task.completed,
      });
      console.log("MainApp - Toggle completion successful:", response.data);

      if (Array.isArray(tasks)) {
        setTasks(tasks.map((task) => (task._id === id ? response.data : task)));
      }
    } catch (error) {
      console.error("MainApp - Error updating task:", error);
      if (error.response?.status === 401) {
        handle401Error();
      } else {
        setError("Failed to update task status. Please try again.");
      }
    }
  };

  // Show loading screen while auth is being determined
  if (authLoading || !isInitialized) {
    console.log("MainApp - Showing auth loading screen");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth forms if not authenticated
  if (!isAuthenticated) {
    console.log("MainApp - Showing auth forms");
    return (
      <>
        {authMode === "login" ? (
          <Login onToggleMode={() => setAuthMode("register")} />
        ) : (
          <Register onToggleMode={() => setAuthMode("login")} />
        )}
      </>
    );
  }

  console.log("MainApp - Rendering main app for authenticated user");

  // Main authenticated app
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-gray-600">
              Manage your tasks and stay organized
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center space-x-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition duration-200"
            >
              <span>👤</span>
              <span>Profile</span>
            </button>

            <button
              onClick={fetchTasks}
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition duration-200 disabled:opacity-50"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Debug Info (remove in production) */}
        {window.location.hostname === "localhost" && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-sm">
            <strong>Debug Info:</strong> API URL: {API_URL} | Auth Header:{" "}
            {axios.defaults.headers.common["Authorization"]
              ? "Present"
              : "Missing"}{" "}
            | Tasks: {tasks.length} | Initialized: {isInitialized.toString()}
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

        {/* Profile Modal */}
        {showProfile && <Profile onClose={() => setShowProfile(false)} />}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>Built with MERN Stack. ©Gontse Maepa 2025</p>
        </div>
      </div>
    </div>
  );
};

// Root App Component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
