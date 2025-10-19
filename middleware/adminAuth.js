const auth = require("./auth");

const isAdmin = async (req, res, next) => {
  try {
    // First verify JWT token using auth middleware
    await auth(req, res, (err) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Check if user is admin
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin privileges required.",
        });
      }

      next();
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = isAdmin;
