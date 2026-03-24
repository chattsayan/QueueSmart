const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Branch name is required"],
      trim: true,
      minlength: [3, "Branch name must be at least 3 characters"],
      maxlength: [100, "Branch name cannot exceed 100 characters"],
    },
    code: {
      type: String,
      required: [true, "Branch code is required"],
      uppercase: true,
      trim: true,
      unique: true,
      index: true,
      minlength: [2, "Branch code must be at least 2 characters"],
      maxlength: [20, "Branch code cannot exceed 20 characters"],
    },
    contactEmail: {
      type: String,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    contactPhone: {
      type: String,
      match: [/^\+?[1-9]\d{1,14}$/, "Please provide a valid phone number"],
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },
    buisnessHours: [
      {
        day: {
          type: String,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
        },
        isOpen: {
          type: Boolean,
          default: true,
        },
        openTime: {
          type: String,
          match: [
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            "Please provide a valid time in HH:mm format",
          ],
          default: "09:00",
        },
        closeTime: {
          type: String,
          match: [
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            "Please provide a valid time in HH:mm format",
          ],
          default: "17:00",
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    settings: {
      allowVirtualQueue: {
        type: Boolean,
        default: false,
      },
      allowAppointments: {
        type: Boolean,
        default: false,
      },
      maxQueueSize: {
        type: Number,
        default: 100,
        min: 1,
      },
      tokenPrefix: {
        type: String,
        default: "T",
      },
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
branchSchema.index({ organizationId: 1, isActive: 1 });

module.exports = mongoose.model("Branch", branchSchema);
