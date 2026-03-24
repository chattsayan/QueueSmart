const mongoose = require("mongoose");
const { TOKEN_STATUS, PRIORITY } = require("../utils/constants");

const tokenSchema = new mongoose.Schema(
  {
    brnchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch ID is required"],
      index: true, // Add index for faster queries
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Service ID is required"],
      index: true,
    },
    tokenNumber: {
      type: Number,
      required: [true, "Token number is required"],
      uppercase: true,
      index: true,
    },
    displayNumber: {
      type: Number,
      required: [true, "Display number is required"],
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    customerPhone: {
      type: String,
      match: [/^\+?[1-9]\d{1,14}$/, "Please provide a valid phone number"],
    },
    customerName: {
      type: String,
      maxlength: [100, "Customer name cannot exceed 100 characters"],
    },
    status: {
      type: String,
      enum: Object.values(TOKEN_STATUS),
      default: TOKEN_STATUS.PENDING,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(PRIORITY),
      default: PRIORITY.NORMAL,
      index: true,
    },
    appointmentTime: {
      type: Date,
    },
    isVirtualQueue: {
      type: Boolean,
      default: false,
    },

    //   Timestamp for queue management
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    calledAt: Date,
    servingStartedAt: Date,
    completedAt: Date,

    // Queue position and timing
    queuePosition: {
      type: Number,
    },
    estimatedWaitTime: {
      type: Number, // in minutes
    },

    //   Service Details
    assignedCounterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Counter",
    },
    assignedStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    transferredFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Token",
    },

    //   Additional Info
    notes: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: String,

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Compound Indexes for performance optimization
tokenSchema.index({ brnchId: 1, serviceId: 1, createdAt: -1 });
tokenSchema.index({
  brnchId: 1,
  serviceId: 1,
  status: 1,
  priority: 1,
  createdAt: -1,
});
tokenSchema.index({ tokenNumber: 1, brnchId: 1 }, { unique: true });
tokenSchema.index({ customerId: 1, status: 1 });
tokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 }); // Auto-remove tokens after 7 days

// Virtual for actual wait time
tokenSchema.virtual("actualWaitTime").get(function () {
  if (this.calledAt && this.createdAt) {
    return Math.round((this.calledAt - this.createdAt) / 1000 / 60); // Convert milliseconds to minutes
  }
  return null;
});

// Virtual for total service time
tokenSchema.virtual("actualServiceTime").get(function () {
  if (this.completedAt && this.servingStartedAt) {
    return Math.round((this.completedAt - this.servingStartedAt) / 1000 / 60); // Convert milliseconds to minutes
  }
  return null;
});

// Method to calculate current wait time based on status
tokenSchema.methods.calculateEstimatedWaitTime = async function () {
  const Service = mongoose.model("Service");
  const Token = mongoose.model("Token");

  const service = await Service.findById(this.serviceId);
  if (!service) return 0;

  // Count tokens ahead in the queue
  const tokensAhead = await Token.countDocuments({
    brnchId: this.brnchId,
    serviceId: this.serviceId,
    status: TOKEN_STATUS.WAITING,
    $or: [
      { priority: { $gt: this.priority } },
      { priority: this.priority, createdAt: { $lt: this.createdAt } },
    ],
  });

  return tokensAhead * service.estimatedServiceTime; // Assuming estimatedServiceTime is in minutes
};

// Pre-save hook to update timestamps
tokenSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Token", tokenSchema);
