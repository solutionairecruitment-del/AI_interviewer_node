const User = require("../models/User");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const sendReportEmailWithAttachment = require("../utils/sendReportEmailWithAttachment");

// Multer setup (still needed for form-data uploads)
const storage = multer.memoryStorage(); // store in memory instead of disk
const profilePicUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMime = [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/gif",
      "image/webp",
    ];
    if (allowedMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Only image files are allowed (png, jpg, jpeg, gif, webp).")
      );
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
const profilePictureMulterMiddleware = profilePicUpload.single("image");

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
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

// Update profile info
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
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

// Upload profile picture (convert everything to base64)
const uploadProfilePicture = async (req, res) => {
  try {
    let base64Image;

    // Case 1: File uploaded via form-data
    if (req.file) {
      base64Image = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;
    }
    // Case 2: Image sent as base64 string
    else if (
      req.body.image &&
      typeof req.body.image === "string" &&
      req.body.image.startsWith("data:image/")
    ) {
      base64Image = req.body.image;
    } else {
      return res.status(400).json({
        success: false,
        message: "No image file or valid base64 image provided.",
      });
    }

    // Save base64 string in MongoDB
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: base64Image },
      { new: true }
    );

    res.json({
      success: true,
      message: "Profile picture updated successfully",
      data: { user: user.toJSON() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// -------------------- GET REPORTS --------------------
const getReports = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("reports");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        reports: user.reports,
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

// -------------------- POST REPORT --------------------
const uploadReport = async (req, res) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: "session_id is required",
      });
    }

    let base64File, fileType, fileName;

    // Case 1: Multer form-data file
    if (req.file) {
      fileType = req.file.mimetype;
      fileName = req.file.originalname;
      const fileBuffer = fs.readFileSync(req.file.path); // diskStorage
      base64File = `data:${fileType};base64,${fileBuffer.toString("base64")}`;
    }
    // Case 2: Direct base64
    else if (
      req.body.file &&
      typeof req.body.file === "string" &&
      req.body.file.startsWith("data:")
    ) {
      base64File = req.body.file;
      const matches = base64File.match(/^data:(.*);base64,/);
      if (matches) fileType = matches[1];
      fileName = `report-${Date.now()}`;
    } else {
      return res.status(400).json({
        success: false,
        message: "No file provided (form-data or base64).",
      });
    }

    // Save to DB
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: {
          reports: {
            sessionId: session_id,
            fileName,
            fileType,
            fileData: base64File,
          },
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Report uploaded successfully",
      data: { reports: user.reports },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// FETCH REPORT BY SESSION_ID
const getReportBySessionId = async (req, res) => {
  try {
    const { session_id } = req.params;

    const user = await User.findById(req.user._id).select("reports");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const report = user.reports.find(
      (report) => report.sessionId === session_id
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    res.json({
      success: true,
      data: {
        report,
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

// DOWNLOAD REPORT PDF
const downloadReportBySessionId = async (req, res) => {
  try {
    const { session_id } = req.params;

    const user = await User.findById(req.user._id).select("reports");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const report = user.reports.find((r) => r.sessionId === session_id);
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }

    // Remove "data:application/pdf;base64," prefix before decoding
    const base64Data = report.fileData.split(",")[1];
    const fileBuffer = Buffer.from(base64Data, "base64");

    res.setHeader("Content-Type", report.fileType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${report.fileName}"`
    );

    res.send(fileBuffer);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// POST ROUTE FOR POSTING THE PDF TO THE EMAIL ID OF THE PARTICULAR USER

const postReportToEmail = async (req, res) => {
  try {
    const { email, session_id, body } = req.body;

    if (!email || !session_id) {
      return res.status(400).json({
        success: false,
        message: "Email, session_id, and body are required",
      });
    }

    const user = await User.findById(req.user._id).select("reports");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const report = user.reports.find((r) => r.sessionId === session_id);

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }

    // ✅ Pass full report object now (contains fileName, fileType, fileData)
    await sendReportEmailWithAttachment(
      email,
      "Your AI Interviewer Report",
      body || "Please find your attached report below.",
      report
    );

    res.json({
      success: true,
      message: "Report email sent successfully",
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
  getProfile,
  updateProfile,
  uploadProfilePicture,
  profilePictureMulterMiddleware,
  getReports,
  uploadReport,
  getReportBySessionId,
  downloadReportBySessionId,
  postReportToEmail,
};
