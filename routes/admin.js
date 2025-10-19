const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const isAdmin = require("../middleware/adminAuth");
const {
  validateForwardCandidate,
  validateUpdateForwardedApplication,
} = require("../middleware/validation");

// All admin routes require admin authentication
router.use(isAdmin);

// User management
router.get("/users", adminController.getAllUsers);
router.put("/users/:id", adminController.updateUser);

// Candidate forwarding
router.post(
  "/forward-candidate",
  validateForwardCandidate,
  adminController.forwardCandidate
);

// Forwarded applications management
router.get("/forwarded-applications", adminController.getForwardedApplications);
router.put(
  "/forwarded-applications/:id",
  validateUpdateForwardedApplication,
  adminController.updateForwardedApplication
);

// Dashboard
router.get("/dashboard", adminController.getDashboardStats);

// Token blacklist management
router.get("/blacklisted-tokens", adminController.getBlacklistedTokens);
router.post("/clear-expired-tokens", adminController.clearExpiredTokens);

module.exports = router;
