const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["job", "internship", "training", "event", "general"],
      default: "general",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    attachments: [
      {
        filename: {
          type: String,
          required: true,
        },
        originalName: {
          type: String,
          required: true,
        },
        mimetype: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          required: true,
        },
        path: {
          type: String,
          required: true,
        },
      },
    ],
    targetAudience: {
      type: [String],
      enum: [
        "all",
        "final_year",
        "pre_final_year",
        "second_year",
        "first_year",
      ],
      default: ["all"],
    },
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
    expiresAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
announcementSchema.index({ category: 1, isActive: 1, isPublished: 1 });
announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ expiresAt: 1 });

// Virtual for checking if announcement is expired
announcementSchema.virtual("isExpired").get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Method to increment views
announcementSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

// Static method to get active announcements
announcementSchema.statics.getActiveAnnouncements = function () {
  return this.find({
    isActive: true,
    isPublished: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ],
  }).sort({ priority: -1, createdAt: -1 });
};

// Add pagination plugin
announcementSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Announcement", announcementSchema);
