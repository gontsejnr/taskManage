const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user and attach to request
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          message: "Token is valid but user no longer exists",
        });
      }

      // Attach user to request object
      req.user = {
        id: user._id,
        name: user.name,
        email: user.email,
      };

      next();
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError.message);
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      message: "Authentication error",
      error: error.message,
    });
  }
};

module.exports = { protect };
