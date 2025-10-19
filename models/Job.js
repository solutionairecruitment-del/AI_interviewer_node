const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [200, "Job title cannot exceed 200 characters"],
    },
    company: {
      name: {
        type: String,
        required: [true, "Company name is required"],
        trim: true,
      },
      logo: {
        type: String,
      },
      website: {
        type: String,
      },
      location: {
        type: String,
        required: [true, "Company location is required"],
      },
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
    },
    requirements: {
      skills: [
        {
          type: String,
          trim: true,
        },
      ],
      experience: {
        type: String,
        required: true,
      },
      education: {
        type: String,
        required: true,
      },
      cgpa: {
        min: {
          type: Number,
          min: 0,
          max: 10,
        },
      },
    },
    package: {
      ctc: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: "INR",
      },
      breakdown: {
        basic: Number,
        hra: Number,
        da: Number,
        other: Number,
      },
    },
    jobType: {
      type: String,
      enum: ["full_time", "part_time", "internship", "contract"],
      required: true,
    },
    workMode: {
      type: String,
      enum: ["onsite", "remote", "hybrid"],
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    positions: {
      type: Number,
      required: true,
      min: 1,
    },
    applications: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["pending", "shortlisted", "rejected", "selected"],
          default: "pending",
        },
        resume: {
          filename: String,
          originalName: String,
          mimetype: String,
          size: Number,
          path: String,
        },
        coverLetter: {
          type: String,
        },
        interviewScheduled: {
          type: Boolean,
          default: false,
        },
        interviewDate: {
          type: Date,
        },
        notes: {
          type: String,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
jobSchema.index({ isActive: 1, isPublished: 1, deadline: 1 });
jobSchema.index({ "company.name": 1 });
jobSchema.index({ jobType: 1, workMode: 1 });
jobSchema.index({ createdAt: -1 });

// Virtual for checking if job is expired
jobSchema.virtual("isExpired").get(function () {
  return new Date() > this.deadline;
});

// Virtual for application count
jobSchema.virtual("applicationCount").get(function () {
  return this.applications.length;
});

// Method to increment views
jobSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

// Method to add application
jobSchema.methods.addApplication = function (studentId, applicationData) {
  const existingApplication = this.applications.find(
    (app) => app.student.toString() === studentId.toString()
  );

  if (existingApplication) {
    throw new Error("Student has already applied for this job");
  }

  this.applications.push({
    student: studentId,
    ...applicationData,
  });

  return this.save();
};

// Static method to get active jobs
jobSchema.statics.getActiveJobs = function () {
  return this.find({
    isActive: true,
    isPublished: true,
    deadline: { $gt: new Date() },
  }).sort({ createdAt: -1 });
};

// Add pagination plugin
jobSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Job", jobSchema);
