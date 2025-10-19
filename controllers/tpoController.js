const Announcement = require("../models/Announcement");
const Job = require("../models/Job");
const User = require("../models/User");
const { deleteFile, getFileUrl } = require("../middleware/fileUpload");
const path = require("path");

// Announcement Controllers
const createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      priority,
      targetAudience,
      tags,
      expiresAt,
    } = req.body;

    // Handle file uploads
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
        });
      });
    }

    const announcement = new Announcement({
      title,
      content,
      category,
      priority,
      targetAudience: targetAudience ? targetAudience.split(",") : ["all"],
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      attachments,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.user._id,
    });

    await announcement.save();

    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      data: announcement,
    });
  } catch (error) {
    console.error("Create Announcement Error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating announcement",
      error: error.message,
    });
  }
};

const getAllAnnouncements = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      priority,
      isActive,
      isPublished,
      search,
    } = req.query;

    const query = {};

    // Only show announcements for this TPO unless admin or student/candidate
    if (
      req.user.role !== "admin" &&
      req.user.role !== "candidate" &&
      req.user.role !== "student"
    ) {
      query.createdBy = req.user._id;
    } else if (req.user.role === "candidate" || req.user.role === "student") {
      // Show only announcements from TPOs with the same collegeId
      const tpoUsers = await User.find({
        role: "tpo",
        collegeId: req.user.collegeId,
      }).select("_id");
      query.createdBy = { $in: tpoUsers.map((u) => u._id) };
    }

    // Apply filters
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (isPublished !== undefined) query.isPublished = isPublished === "true";
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: {
        path: "createdBy",
        select: "name email",
      },
    };

    const announcements = await Announcement.paginate(query, options);

    res.json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    console.error("Get Announcements Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching announcements",
      error: error.message,
    });
  }
};

const getAnnouncementById = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    // Increment views if user is authenticated
    if (req.user) {
      await announcement.incrementViews();
    }

    res.json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    console.error("Get Announcement Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching announcement",
      error: error.message,
    });
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    // Check if user is the creator or admin
    if (
      announcement.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this announcement",
      });
    }

    const updateData = { ...req.body };

    // Handle new file uploads
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
      }));

      updateData.attachments = [...announcement.attachments, ...newAttachments];
    }

    // Handle array fields
    if (req.body.targetAudience) {
      updateData.targetAudience = req.body.targetAudience.split(",");
    }
    if (req.body.tags) {
      updateData.tags = req.body.tags.split(",").map((tag) => tag.trim());
    }

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");

    res.json({
      success: true,
      message: "Announcement updated successfully",
      data: updatedAnnouncement,
    });
  } catch (error) {
    console.error("Update Announcement Error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating announcement",
      error: error.message,
    });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    // Check if user is the creator or admin
    if (
      announcement.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this announcement",
      });
    }

    // Delete attached files
    if (announcement.attachments && announcement.attachments.length > 0) {
      announcement.attachments.forEach((attachment) => {
        deleteFile(attachment.path);
      });
    }

    await Announcement.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    console.error("Delete Announcement Error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting announcement",
      error: error.message,
    });
  }
};

const publishAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    announcement.isPublished = true;
    announcement.publishedAt = new Date();
    await announcement.save();

    res.json({
      success: true,
      message: "Announcement published successfully",
      data: announcement,
    });
  } catch (error) {
    console.error("Publish Announcement Error:", error);
    res.status(500).json({
      success: false,
      message: "Error publishing announcement",
      error: error.message,
    });
  }
};

// Job Controllers
const createJob = async (req, res) => {
  try {
    const {
      title,
      companyName,
      companyWebsite,
      companyLocation,
      description,
      skills,
      experience,
      education,
      minCgpa,
      ctc,
      currency,
      basic,
      hra,
      da,
      other,
      jobType,
      workMode,
      location,
      deadline,
      positions,
      tags,
    } = req.body;

    const job = new Job({
      title,
      company: {
        name: companyName,
        website: companyWebsite,
        location: companyLocation,
      },
      description,
      requirements: {
        skills: skills ? skills.split(",").map((skill) => skill.trim()) : [],
        experience,
        education,
        cgpa: minCgpa ? { min: parseFloat(minCgpa) } : null,
      },
      package: {
        ctc: parseFloat(ctc),
        currency: currency || "INR",
        breakdown: {
          basic: basic ? parseFloat(basic) : null,
          hra: hra ? parseFloat(hra) : null,
          da: da ? parseFloat(da) : null,
          other: other ? parseFloat(other) : null,
        },
      },
      jobType,
      workMode,
      location,
      deadline: new Date(deadline),
      positions: parseInt(positions),
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      createdBy: req.user._id,
    });

    await job.save();

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job,
    });
  } catch (error) {
    console.error("Create Job Error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating job",
      error: error.message,
    });
  }
};

const getAllJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      jobType,
      workMode,
      location,
      isActive,
      isPublished,
      search,
    } = req.query;

    const query = {};

    // Only show jobs for this TPO unless admin or student/candidate
    if (
      req.user.role !== "admin" &&
      req.user.role !== "candidate" &&
      req.user.role !== "student"
    ) {
      query.createdBy = req.user._id;
    } else if (req.user.role === "candidate" || req.user.role === "student") {
      // Show only jobs from TPOs with the same collegeId
      const tpoUsers = await User.find({
        role: "tpo",
        collegeId: req.user.collegeId,
      }).select("_id");
      query.createdBy = { $in: tpoUsers.map((u) => u._id) };
    }

    // Apply filters
    if (jobType) query.jobType = jobType;
    if (workMode) query.workMode = workMode;
    if (location) query.location = { $regex: location, $options: "i" };
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (isPublished !== undefined) query.isPublished = isPublished === "true";
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { "company.name": { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: {
        path: "createdBy",
        select: "name email",
      },
    };

    const jobs = await Job.paginate(query, options);

    res.json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    console.error("Get Jobs Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching jobs",
      error: error.message,
    });
  }
};

const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("applications.student", "name email rollNumber");

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Increment views if user is authenticated
    if (req.user) {
      await job.incrementViews();
    }

    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error("Get Job Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching job",
      error: error.message,
    });
  }
};

const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if user is the creator or admin
    if (
      job.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this job",
      });
    }

    const updateData = { ...req.body };

    // Handle array fields
    if (req.body.skills) {
      updateData["requirements.skills"] = req.body.skills
        .split(",")
        .map((skill) => skill.trim());
    }
    if (req.body.tags) {
      updateData.tags = req.body.tags.split(",").map((tag) => tag.trim());
    }

    const updatedJob = await Job.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "name email");

    res.json({
      success: true,
      message: "Job updated successfully",
      data: updatedJob,
    });
  } catch (error) {
    console.error("Update Job Error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating job",
      error: error.message,
    });
  }
};

const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if user is the creator or admin
    if (
      job.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this job",
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Delete Job Error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting job",
      error: error.message,
    });
  }
};

const publishJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    job.isPublished = true;
    job.publishedAt = new Date();
    await job.save();

    res.json({
      success: true,
      message: "Job published successfully",
      data: job,
    });
  } catch (error) {
    console.error("Publish Job Error:", error);
    res.status(500).json({
      success: false,
      message: "Error publishing job",
      error: error.message,
    });
  }
};

// Dashboard Statistics
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalAnnouncements,
      publishedAnnouncements,
      totalJobs,
      publishedJobs,
      totalApplications,
      recentAnnouncements,
      recentJobs,
    ] = await Promise.all([
      Announcement.countDocuments(),
      Announcement.countDocuments({ isPublished: true }),
      Job.countDocuments(),
      Job.countDocuments({ isPublished: true }),
      Job.aggregate([{ $unwind: "$applications" }, { $count: "total" }]).then(
        (result) => result[0]?.total || 0
      ),
      Announcement.find({ isPublished: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("createdBy", "name"),
      Job.find({ isPublished: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("createdBy", "name"),
    ]);

    res.json({
      success: true,
      data: {
        announcements: {
          total: totalAnnouncements,
          published: publishedAnnouncements,
        },
        jobs: {
          total: totalJobs,
          published: publishedJobs,
        },
        applications: totalApplications,
        recentAnnouncements,
        recentJobs,
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
      error: error.message,
    });
  }
};

module.exports = {
  // Announcement controllers
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  publishAnnouncement,

  // Job controllers
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  publishJob,

  // Dashboard
  getDashboardStats,
};
