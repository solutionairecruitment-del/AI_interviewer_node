const User = require("../models/User");
const ForwardedApplication = require("../models/ForwardedApplication");
const redisService = require("../utils/redisService");

// GET /api/admin/users - Get all users
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, userType, status } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (userType) {
      query.userType = userType;
    }

    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get users with pagination
    const users = await User.find(query)
      .select("-password -resetToken -resetTokenExpiry") // Exclude sensitive data
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(totalUsers / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// PUT /api/admin/users/:id - Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated via admin
    delete updateData.password;
    delete updateData.email; // Email should be updated through user's own account
    delete updateData.resetToken;
    delete updateData.resetTokenExpiry;

    // Find and update user
    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
      select: "-password -resetToken -resetTokenExpiry", // Exclude sensitive data
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User updated successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// POST /api/admin/forward-candidate - Forward candidate to job
const forwardCandidate = async (req, res) => {
  try {
    const { candidateId, jobId, notes } = req.body;
    const adminId = req.user._id;

    // Validate candidate exists and is actually a candidate
    const candidate = await User.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    if (candidate.userType !== "candidate") {
      return res.status(400).json({
        success: false,
        message: "User is not a candidate",
      });
    }

    // Check if already forwarded for this job
    const existingForward = await ForwardedApplication.findOne({
      candidateId,
      jobId,
    });

    if (existingForward) {
      return res.status(400).json({
        success: false,
        message: "Candidate already forwarded for this job",
      });
    }

    // Create forwarded application
    const forwardedApplication = new ForwardedApplication({
      candidateId,
      jobId,
      forwardedBy: adminId,
      notes: notes || "",
    });

    await forwardedApplication.save();

    // Populate candidate and admin info
    await forwardedApplication.populate([
      { path: "candidate", select: "name email userType" },
      { path: "admin", select: "name email" },
    ]);

    res.status(201).json({
      success: true,
      message: "Candidate forwarded successfully",
      data: {
        forwardedApplication,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// GET /api/admin/forwarded-applications - Get all forwarded applications
const getForwardedApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, candidateId, jobId } = req.query;

    // Build query
    const query = {};

    if (status) {
      query.status = status;
    }

    if (candidateId) {
      query.candidateId = candidateId;
    }

    if (jobId) {
      query.jobId = jobId;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get forwarded applications with pagination
    const applications = await ForwardedApplication.find(query)
      .populate("candidate", "name email userType")
      .populate("admin", "name email")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count for pagination
    const totalApplications = await ForwardedApplication.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(totalApplications / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalApplications,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// PUT /api/admin/forwarded-applications/:id - Update forwarded application status
const updateForwardedApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const application = await ForwardedApplication.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate([
      { path: "candidate", select: "name email userType" },
      { path: "admin", select: "name email" },
    ]);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Forwarded application not found",
      });
    }

    res.json({
      success: true,
      message: "Application status updated successfully",
      data: {
        application,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// GET /api/admin/dashboard - Admin dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    // Get user counts by type
    const userStats = await User.aggregate([
      {
        $group: {
          _id: "$userType",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get forwarded applications stats
    const applicationStats = await ForwardedApplication.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get recent activities
    const recentApplications = await ForwardedApplication.find()
      .populate("candidate", "name email")
      .populate("admin", "name email")
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent users
    const recentUsers = await User.find()
      .select("name email userType createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        userStats,
        applicationStats,
        recentApplications,
        recentUsers,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// GET /api/admin/blacklisted-tokens - Get all blacklisted tokens
const getBlacklistedTokens = async (req, res) => {
  try {
    const tokens = await redisService.getBlacklistedTokens();

    res.json({
      success: true,
      data: {
        tokens,
        count: tokens.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// POST /api/admin/clear-expired-tokens - Clear expired tokens
const clearExpiredTokens = async (req, res) => {
  try {
    const clearedCount = await redisService.clearExpiredTokens();

    res.json({
      success: true,
      message: `Cleared ${clearedCount} expired tokens`,
      data: {
        clearedCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  updateUser,
  forwardCandidate,
  getForwardedApplications,
  updateForwardedApplication,
  getDashboardStats,
  getBlacklistedTokens,
  clearExpiredTokens,
};
