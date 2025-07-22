const { body, param, query, validationResult } = require("express-validator");

// validate error handler
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// user validation
const validateRegister = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  handleValidation,
];

const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidation,
];

// task validation
const validateTask = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Priority must be low, medium, high, or urgent"),
  body("status")
    .optional()
    .isIn(["todo", "in-progress", "review", "done"])
    .withMessage("Status must be todo, in-progress, review, or done"),
  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date"),
  handleValidation,
];

// project validation
const validateProject = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Project name must be between 1 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("status")
    .optional()
    .isIn(["active", "completed", "archived", "on-hold"])
    .withMessage("Status must be active, completed, archived, or on-hold"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be low, medium, or high"),
  handleValidation,
];

// comment validation
const validateComment = [
  body("text")
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Comment must be between 1 and 500 characters"),
  handleValidation,
];

// ID parameter validation
const validateObjectId = [
  param("id").isMongoId().withMessage("Invalid ID format"),
  handleValidation,
];

// pagination validation
const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  handleValidation,
];

module.exports = {
  handleValidation,
  validateRegister,
  validateLogin,
  validateTask,
  validateProject,
  validateComment,
  validateObjectId,
  validatePagination,
};
