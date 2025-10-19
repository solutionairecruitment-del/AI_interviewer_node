const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");
const {
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} = require("../middleware/validation");

// POST /api/auth/register
router.post("/register", validateRegistration, authController.register);

// POST /api/auth/login
router.post("/login", validateLogin, authController.login);

// POST /api/auth/forgot-password
router.post(
  "/forgot-password",
  validateForgotPassword,
  authController.forgotPassword
);

// POST /api/auth/reset-password
router.post(
  "/reset-password",
  validateResetPassword,
  authController.resetPassword
);

// GET /api/auth/verify-email
router.get("/verify-email", authController.verifyEmail);

// POST /api/auth/logout
router.post("/logout", auth, authController.logout);

module.exports = router;
