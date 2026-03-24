const mongoose = require("mongoose");
const { COUNTER_STATUS } = require("../utils/constants");

const counterSchema = new mongoose.Schema(
  {
    brnchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch ID is required"],
      index: true, // Add index for faster queries
    },
    number: {
      type: Number,
      required: [true, "Counter number is required"],
      min: [1, "Counter number must be at least 1"],
    },
    name: {
      type: String,
      required: [100, "Counter name cannot exceed 100 characters"],
    },
    assignedServices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
    assignedStaffId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: Object.values(COUNTER_STATUS),
      default: COUNTER_STATUS.OFFLINE,
      index: true, // Add index for faster queries
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
counterSchema.index({ brnchId: 1, number: 1 }, { unique: true });
counterSchema.index({ brnchId: 1, status: 1 });
counterSchema.index({ assignedStaffId: 1 });

// Virtual for display name
counterSchema.virtual("displayName").get(function () {
  return this.name || `Counter ${this.number}`;
});

module.exports = mongoose.model("Counter", counterSchema);
