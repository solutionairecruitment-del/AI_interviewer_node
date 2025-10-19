const express = require("express");
const multer = require("multer");
const { buildProfile } = require("../controllers/profileController");
const auth = require("../middleware/auth");
const { uploadResume } = require("../middleware/fileUpload");

const router = express.Router();

// POST /api/profile/build - Comprehensive profile scraping and building
router.post("/build", auth, uploadResume, buildProfile);

module.exports = router;
