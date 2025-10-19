const express = require("express");
const router = express.Router();
const tpoController = require("../controllers/tpoController");
const { tpoAuth, studentAuth, optionalAuth } = require("../middleware/tpoAuth");
const {
  uploadAttachments,
  uploadResume,
  uploadLogo,
} = require("../middleware/fileUpload");
const {
  validateAnnouncement,
  validateJob,
} = require("../middleware/validation");

// Dashboard
router.get("/dashboard", tpoAuth, tpoController.getDashboardStats);

// Announcement Routes
router.post(
  "/announcements",
  tpoAuth,
  uploadAttachments,
  validateAnnouncement,
  tpoController.createAnnouncement
);

router.get("/announcements", optionalAuth, tpoController.getAllAnnouncements);

router.get(
  "/announcements/:id",
  optionalAuth,
  tpoController.getAnnouncementById
);

router.put(
  "/announcements/:id",
  tpoAuth,
  uploadAttachments,
  validateAnnouncement,
  tpoController.updateAnnouncement
);

router.delete("/announcements/:id", tpoAuth, tpoController.deleteAnnouncement);

router.patch(
  "/announcements/:id/publish",
  tpoAuth,
  tpoController.publishAnnouncement
);

// Job Routes
router.post("/jobs", tpoAuth, uploadLogo, validateJob, tpoController.createJob);

router.get("/jobs", optionalAuth, tpoController.getAllJobs);

router.get("/jobs/:id", optionalAuth, tpoController.getJobById);

router.put(
  "/jobs/:id",
  tpoAuth,
  uploadLogo,
  validateJob,
  tpoController.updateJob
);

router.delete("/jobs/:id", tpoAuth, tpoController.deleteJob);

router.patch("/jobs/:id/publish", tpoAuth, tpoController.publishJob);

// Student-specific routes (for viewing announcements and jobs)
router.get("/student/announcements", studentAuth, (req, res) => {
  // Filter announcements based on student's year/audience
  req.query.targetAudience = req.user.year || "all";
  tpoController.getAllAnnouncements(req, res);
});

router.get("/student/jobs", studentAuth, tpoController.getAllJobs);

router.get(
  "/student/announcements/:id",
  studentAuth,
  tpoController.getAnnouncementById
);

router.get("/student/jobs/:id", studentAuth, tpoController.getJobById);

module.exports = router;
