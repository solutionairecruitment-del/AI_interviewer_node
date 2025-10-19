const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["candidate", "interviewer", "admin", "tpo", "student"],
      default: "candidate",
    },
    // Student-specific fields
    rollNumber: {
      type: String,
      trim: true,
    },
    year: {
      type: String,
      enum: ["first_year", "second_year", "pre_final_year", "final_year"],
    },
    branch: {
      type: String,
      trim: true,
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 10,
    },
    phone: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "verified", "suspended"],
      default: "active",
    },
    resetToken: {
      type: String,
    },
    resetTokenExpiry: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    collegeId: {
      type: String,
      required: function () {
        return this.role === "student" || this.role === "tpo";
      },
      trim: true,
    },
    collegeName: {
      type: String,
      trim: true,
      default: null,
    },
    collegeYearStart: {
      type: Number,
      required: function () {
        return this.role === "student";
      },
      min: 1900,
      max: 2100,
      default: null,
    },
    collegeYearEnd: {
      type: Number,
      required: function () {
        return this.role === "student";
      },
      min: 1900,
      max: 2100,
      default: null,
    },
    reports: [
  {
    sessionId: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true }, // MIME type
    fileData: { type: String, required: true }, // base64 encoded file
    uploadedAt: { type: Date, default: Date.now }
  }
],

  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user data without password
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.resetToken;
  delete user.resetTokenExpiry;
  return user;
};

module.exports = mongoose.model("User", userSchema);
