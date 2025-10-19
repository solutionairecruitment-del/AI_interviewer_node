const mongoose = require("mongoose");

const forwardedApplicationSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Candidate ID is required"],
    },
    jobId: {
      type: String,
      required: [true, "Job ID is required"],
      trim: true,
    },
    forwardedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Admin ID is required"],
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "accepted", "rejected"],
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
forwardedApplicationSchema.index({ candidateId: 1, jobId: 1 });
forwardedApplicationSchema.index({ forwardedBy: 1 });
forwardedApplicationSchema.index({ status: 1 });

// Virtual for populated data
forwardedApplicationSchema.virtual("candidate", {
  ref: "User",
  localField: "candidateId",
  foreignField: "_id",
  justOne: true,
});

forwardedApplicationSchema.virtual("admin", {
  ref: "User",
  localField: "forwardedBy",
  foreignField: "_id",
  justOne: true,
});

// virtuals are included in JSON output
forwardedApplicationSchema.set("toJSON", { virtuals: true });
forwardedApplicationSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model(
  "ForwardedApplication",
  forwardedApplicationSchema
);
