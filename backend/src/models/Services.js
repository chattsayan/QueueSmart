const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    brnchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch ID is required"],
      index: true, // Add index for faster queries
    },
    name: {
      type: String,
      required: [true, "Branch name is required"],
      trim: true,
      minlength: [3, "Branch name must be at least 3 characters"],
      maxlength: [100, "Branch name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    category: {
      type: String,
      maxlength: [50, "Category cannot exceed 50 characters"],
    },
    estimatedServiceTime: {
      type: Number,
      required: [true, "Estimated service time is required"],
      min: [1, "Estimated service time must be at least 1 minute"],
      max: [300, "Estimated service time cannot exceed 300 minutes (5 hours)"],
      default: 10, // Default to 10 minutes if not provided
    },
    tokenPrefix: {
      type: String,
      required: [true, "Token prefix is required"],
      uppercase: true,
      length: [1, "Token prefix must be exactly 1 character"],
      match: [/^[A-Z]$/, "Token prefix must be a single uppercase letter"],
    },
    priority: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    color: {
      type: String,
      match: [/^#[0-9A-F]{6}$/i, "Color must be a valid hex color code"],
      default: "#2196F3",
    },
    icon: {
      type: String,
      maxlength: [50, "Icon URL cannot exceed 50 characters"],
    },
    settings: {
      requiresAppointment: {
        type: Boolean,
        default: false,
      },
      maxConcurrentTokens: {
        type: Number,
        min: 1,
        default: 50,
      },
      allowPriority: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
serviceSchema.index({ brnchId: 1, isActive: 1 });
serviceSchema.index({ brnchId: 1, tokenPrefix: 1 }, { unique: true });

// Virtual for current count (will be populated in queries)
serviceSchema.virtual("currentQueueCount", {
  ref: "Token",
  localField: "_id",
  foreignField: "serviceId",
  count: true,
  match: { status: "waiting" },
});

module.exports = mongoose.model("Service", serviceSchema);
