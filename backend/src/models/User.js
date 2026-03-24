const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ROLES, USER_STATUS } = require("../utils/constants");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false, // Don't return password by default
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    phone: {
      type: String,
      match: [/^\+?[1-9]\d{1,14}$/, "Please provide a valid phone number"],
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    profilePicture: {
      type: String,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },
    permissions: {
      type: [String],
      default: [],
    },
    lastLogin: {
      type: Date,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ organizationId: 1 }, { role: 1 });
userSchema.index({ branchId: 1 }, { role: 1 });

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Update passwordChangedAt when password is modified
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; // Set to 1 second in the past to ensure token is created after this time
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token method
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      organizationId: this.organizationId,
      branchId: this.branchId,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "1h" },
  );
};

// Generate refresh token method
userSchema.methods.getRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
  });
};

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

module.exports = mongoose.model("User", userSchema);
