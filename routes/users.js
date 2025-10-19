const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");
const { validateUpdateProfile } = require("../middleware/validation");
const { uploadSingle } = require("../middleware/fileUpload");

// Import the multer middleware from userController
const {
  profilePictureMulterMiddleware,
} = require("../controllers/userController");

// GET /api/users/me - Get current user profile
router.get("/me", auth, userController.getProfile);

// PUT /api/users/me - Update current user profile
router.put("/me", auth, validateUpdateProfile, userController.updateProfile);

// POST /api/users/profile-picture - Upload profile picture
router.post(
  "/profile-picture",
  auth,
  profilePictureMulterMiddleware,
  userController.uploadProfilePicture
);

// GET /api/users/reports - fetch all reports
router.get("/reports", auth, userController.getReports);

// POST /api/users/reports - upload a report
router.post("/reports", auth, uploadSingle, userController.uploadReport);

// GET /api/users/reports/:session_id - fetch report by session_id
router.get("/reports/:session_id", auth, userController.getReportBySessionId);

// GET /api/users/reports/:session_id/download - download report PDF
router.get(
  "/reports/:session_id/download",
  auth,
  userController.downloadReportBySessionId
);

// POST /api/users/reports/email - send report to email
router.post("/reports/email", auth, userController.postReportToEmail);

module.exports = router;
