const validateRegistration = (req, res, next) => {
  const { name, email, password, role, username } = req.body;
  const errors = [];

  // Name validation
  if (!name || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  // Username validation
  if (!username || username.trim().length < 3) {
    errors.push("Username must be at least 3 characters long");
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push("Please provide a valid email address");
  }

  // Password validation
  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  // Role validation
  const validRoles = ["candidate", "interviewer", "admin", "tpo", "student"];
  if (role && !validRoles.includes(role)) {
    errors.push(
      "Role must be one of: candidate, interviewer, admin, tpo, student"
    );
  }

  // College ID validation for student and tpo
  if (
    (role === "student" || role === "tpo") &&
    (!req.body.collegeId || req.body.collegeId.trim().length === 0)
  ) {
    errors.push("College ID is required for students and TPOs");
  }

  // College year validation for students
  if (role === "student") {
    if (!req.body.collegeYearStart) {
      errors.push("College start year is required for students");
    }
    if (!req.body.collegeYearEnd) {
      errors.push("College end year is required for students");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password, username, name } = req.body;
  const errors = [];

  if (!email && !username && !name) {
    errors.push("Username, email, or name is required");
  }

  if (!password) {
    errors.push("Password is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }
  next();
};

const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;
  const errors = [];

  if (!email) {
    errors.push("Email is required");
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push("Please provide a valid email address");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

const validateResetPassword = (req, res, next) => {
  const { token, newPassword } = req.body;
  const errors = [];

  if (!token) {
    errors.push("Reset token is required");
  }

  if (!newPassword || newPassword.length < 6) {
    errors.push("New password must be at least 6 characters long");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

const validateUpdateProfile = (req, res, next) => {
  const { name, phone } = req.body;
  const errors = [];

  if (name !== undefined && name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  if (phone !== undefined && phone.trim().length > 0) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      errors.push("Please provide a valid phone number");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

const validateForwardCandidate = (req, res, next) => {
  const { candidateId, jobId } = req.body;
  const errors = [];

  if (!candidateId) {
    errors.push("Candidate ID is required");
  }

  if (!jobId) {
    errors.push("Job ID is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

const validateUpdateForwardedApplication = (req, res, next) => {
  const { status } = req.body;
  const errors = [];

  if (
    status &&
    !["pending", "reviewed", "accepted", "rejected"].includes(status)
  ) {
    errors.push("Status must be one of: pending, reviewed, accepted, rejected");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// TPO Validation Functions
const validateAnnouncement = (req, res, next) => {
  const { title, content, category, priority } = req.body;
  const errors = [];

  if (!title || title.trim().length === 0) {
    errors.push("Title is required");
  }

  if (title && title.length > 200) {
    errors.push("Title cannot exceed 200 characters");
  }

  if (!content || content.trim().length === 0) {
    errors.push("Content is required");
  }

  if (
    !category ||
    !["job", "internship", "training", "event", "general"].includes(category)
  ) {
    errors.push(
      "Valid category is required (job, internship, training, event, general)"
    );
  }

  if (priority && !["low", "medium", "high", "urgent"].includes(priority)) {
    errors.push("Valid priority is required (low, medium, high, urgent)");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

const validateJob = (req, res, next) => {
  const {
    title,
    companyName,
    companyLocation,
    description,
    experience,
    education,
    ctc,
    jobType,
    workMode,
    location,
    deadline,
    positions,
  } = req.body;
  const errors = [];

  if (!title || title.trim().length === 0) {
    errors.push("Job title is required");
  }

  if (!companyName || companyName.trim().length === 0) {
    errors.push("Company name is required");
  }

  if (!companyLocation || companyLocation.trim().length === 0) {
    errors.push("Company location is required");
  }

  if (!description || description.trim().length === 0) {
    errors.push("Job description is required");
  }

  if (!experience || experience.trim().length === 0) {
    errors.push("Experience requirement is required");
  }

  if (!education || education.trim().length === 0) {
    errors.push("Education requirement is required");
  }

  if (!ctc || isNaN(parseFloat(ctc)) || parseFloat(ctc) <= 0) {
    errors.push("Valid CTC is required");
  }

  if (
    !jobType ||
    !["full_time", "part_time", "internship", "contract"].includes(jobType)
  ) {
    errors.push(
      "Valid job type is required (full_time, part_time, internship, contract)"
    );
  }

  if (!workMode || !["onsite", "remote", "hybrid"].includes(workMode)) {
    errors.push("Valid work mode is required (onsite, remote, hybrid)");
  }

  if (!location || location.trim().length === 0) {
    errors.push("Job location is required");
  }

  if (!deadline || isNaN(Date.parse(deadline))) {
    errors.push("Valid deadline is required");
  }

  if (deadline && new Date(deadline) <= new Date()) {
    errors.push("Deadline must be in the future");
  }

  if (!positions || isNaN(parseInt(positions)) || parseInt(positions) <= 0) {
    errors.push("Valid number of positions is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateUpdateProfile,
  validateForwardCandidate,
  validateUpdateForwardedApplication,
  validateAnnouncement,
  validateJob,
};
