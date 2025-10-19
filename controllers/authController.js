const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const redisService = require("../utils/redisService");
const {
  sendPasswordResetEmail,
  sendWelcomeEmail,
} = require("../utils/emailService");
const sendVerificationEmail = require("../utils/sendVerificationEmail");
const axios = require("axios");

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      collegeId: user.collegeId,
      collegeName: user.collegeName,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Register User
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      username,
      role,
      collegeId,
      collegeName,
      collegeYearStart,
      collegeYearEnd,
      secretCode,
    } = req.body;

    // Check if user already exists (email or username)
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    if (role === "admin") {
      if (!secretCode || secretCode !== process.env.ADMIN_SECRET_CODE) {
        return res.status(403).json({
          success: false,
          message: "Invalid admin secret code",
        });
      }
    }

    // Generate verification token (JWT, 1 day expiry)
    const verificationToken = jwt.sign(
      { email, username },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    axios
      .post(
        "https://registerscrapserver.skillara.asia/api/register",
        {}, // no body needed here unless Flask expects it
        {
          headers: {
            Authorization: `Bearer ${verificationToken}`,
          },
        }
      )
      .catch((err) => {
        console.error("Failed to post token to Flask server:", err.message);
      });

    // Create new user
    const user = new User({
      name,
      email,
      username,
      password,
      role: role || "candidate",
      isVerified: false,
      verificationToken,
      collegeId: role === "student" || role === "tpo" ? collegeId : undefined,
      collegeName: collegeName || undefined,
      collegeYearStart: role === "student" ? collegeYearStart : undefined,
      collegeYearEnd: role === "student" ? collegeYearEnd : undefined,
      secretCode: role === "admin" ? secretCode : 12345678,
    });

    await user.save();

    // Send verification email
    const verificationLink = `${
      process.env.FRONTEND_URL || "https://node.skillara.asia"
    }/api/auth/verify-email?token=${verificationToken}`;
    sendVerificationEmail(email, name, verificationLink).catch((err) => {
      console.error("Error sending verification email:", err);
    });

    res.status(201).json({
      success: true,
      message:
        "Registration successful! Please check your email to verify your account.",
      data: {
        user: user.toJSON(),
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

// Login User
const login = async (req, res) => {
  try {
    const { email, name, username, password } = req.body;

    // Build query to allow login with email, name, or username
    let query = [];
    if (email) query.push({ email });
    if (name) query.push({ name });
    if (username) query.push({ username }); // Only if username field exists

    if (query.length === 0 || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email, name, or username and password.",
      });
    }

    // Find user by email, name, or username
    const user = await User.findOne({ $or: query });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email first.",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: user.toJSON(),
        token,
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

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with this email does not exist",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save reset token to user
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Send password reset email
    const emailSent = await sendPasswordResetEmail(
      email,
      resetToken,
      user.name
    );

    if (emailSent) {
      res.json({
        success: true,
        message: "Password reset link sent to your email",
      });
    } else {
      // If email fails, still save the token but inform user
      res.json({
        success: true,
        message: "Password reset link sent to your email (check spam folder)",
        data: {
          resetToken, // Only in development
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Update password
    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Password validation error",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Logout User
const logout = async (req, res) => {
  try {
    const token = req.token;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "No token provided for logout",
      });
    }

    // Add token to blacklist
    const blacklisted = await redisService.addToBlacklist(token);

    if (blacklisted) {
      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to logout. Please try again.",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// // Verify Email
// const verifyEmail = async (req, res) => {
//   try {
//     const { token } = req.query;
//     if (!token) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Verification token is required." });
//     }
//     let payload;
//     try {
//       payload = jwt.verify(token, process.env.JWT_SECRET);
//     } catch (err) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid or expired verification token.",
//       });
//     }
//     const user = await User.findOne({
//       email: payload.email,
//       verificationToken: token,
//     });
//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid or expired verification token.",
//       });
//     }
//     user.isVerified = true;
//     user.verificationToken = undefined;
//     await user.save();
//     res.json({
//       success: true,
//       message: "Email verified successfully. You can now log in.",
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ success: false, message: "Server error", error: error.message });
//   }
// };

// Verify Email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Verification token is required." });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token.",
      });
    }

    const user = await User.findOne({
      email: payload.email,
      verificationToken: token,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token.",
      });
    }

    // Mark user as verified
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    // Send welcome email after successful verification
    sendWelcomeEmail(user.email, user.name).catch((err) => {
      console.error("Error sending welcome email:", err);
    });

    res.json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  logout,
  verifyEmail,
};
