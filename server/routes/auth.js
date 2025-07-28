const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateUpdateProfile,
} = require("../middleware/validation");
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} = require("../controller/authController");

// Test route to verify auth routes are loaded
router.get("/test", (req, res) => {
  res.json({
    message: "Auth routes are working!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Public routes
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);

// Protected routes
router.get("/me", protect, getMe);
router.put("/profile", protect, validateUpdateProfile, updateProfile);
router.put("/change-password", protect, validateChangePassword, changePassword);

// Debug route to check all registered routes
router.get("/debug/routes", (req, res) => {
  const routes = router.stack.map((layer) => ({
    path: layer.route?.path || "middleware",
    methods: layer.route?.methods || "N/A",
  }));

  res.json({
    message: "Available auth routes",
    routes,
    totalRoutes: routes.length,
  });
});

module.exports = router;
