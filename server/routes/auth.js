const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} = require("../controller/authController");
const { protect } = require("../middleware/auth");
const {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateUpdateProfile,
} = require("../middleware/validation");

// Public routes
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);

// Protected routes
router.get("/me", protect, getMe);
router.put("/profile", protect, validateUpdateProfile, updateProfile);
router.put("/change-password", protect, validateChangePassword, changePassword);

module.exports = router;
