const User = require("../models/User");
const { createError } = require("../middleware/errorHandler");
const { HTTPS_STATUS, ERROR_CODES } = require("../utils/constants");
const logger = require("../utils/logger");
const { profile } = require("winston");

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  };

  // remove password from output
  user.password = undefined;

  res
    .status(statusCode)
    .cookie("token", token, cookieOptions)
    .json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          organizationId: user.organizationId,
          branchId: user.branchId,
          status: user.status,
        },
        token,
        refreshToken,
      },
      message: "Authentication successful",
    });
};

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    role,
    organizationId,
    branchId,
  } = req.body;

  // Create User
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    phone,
    role,
    organizationId,
    branchId,
  });

  logger.info(`New User Registered: ${email}`);

  sendTokenResponse(user, HTTPS_STATUS.CREATED, res);
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(
      createError(
        "Invalid credentials. User not found.",
        HTTPS_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED,
      ),
    );
  }

  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    return next(
      createError(
        "Invalid credentials.",
        HTTPS_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED,
      ),
    );
  }

  // check if user is active
  if (user.status !== "active") {
    return next(
      createError(
        "Your account has been deactivated. Please contact support.",
        HTTPS_STATUS.FORBIDDEN,
        ERROR_CODES.FORBIDDEN,
      ),
    );
  }

  // update last login
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  logger.info(`User Logged In: ${email}`);

  sendTokenResponse(user, HTTPS_STATUS.OK, res);
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Public
exports.logout = async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(HTTPS_STATUS.OK).json({
    success: true,
    message: "Logged out successfully",
  });
};

// @desc    Refresh token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(
      createError(
        "Refresh token is required.",
        HTTPS_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
      ),
    );
  }

  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return next(
        createError(
          "User not found.",
          HTTPS_STATUS.NOT_FOUND,
          ERROR_CODES.NOT_FOUND,
        ),
      );
    }

    sendTokenResponse(user, HTTPS_STATUS.OK, res);
  } catch (error) {
    return next(
      createError(
        "Invalid or expired refresh token.",
        HTTPS_STATUS.UNAUTHORIZED,
        ERROR_CODES.INVALID_TOKEN,
      ),
    );
  }
};

// @desc    Get current logged in user
// @route   POST /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  const user = await User.findById(req.user.id).populate(
    "organizationId branchId",
  );

  res.status(HTTPS_STATUS.OK).json({
    success: true,
    data: user,
  });
};

// @desc    Update user profile
// @route   POST /api/v1/auth/me
// @access  Private
exports.updateProfile = async (req, res, next) => {
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phone: req.body.phone,
    profilePicture: req.body.profilePicture,
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(HTTPS_STATUS.OK).json({
    success: true,
    data: user,
    message: "Profile updated successfully",
  });
};

// @desc    Change Password
// @route   POST /api/v1/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(
      createError(
        "Please provide current and new password.",
        HTTPS_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
      ),
    );
  }

  const user = await User.findById(req.user.id).select("+password");

  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return next(
      createError(
        "Current password is incorrect.",
        HTTPS_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED,
      ),
    );
  }

  // update password
  user.password = newPassword;
  await user.save();

  logger.info(`User Changed Password: ${user.email}`);

  sendTokenResponse(user, HTTPS_STATUS.OK, res);
};

// @desc    Forgot Password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(
      createError(
        "Email is required.",
        HTTPS_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
      ),
    );
  }

  const user = await User.findOne({ email });

  const genericResponse = () => {
    res.status(HTTPS_STATUS.OK).json({
      success: true,
      message:
        "If that user email is registered, a password reset link has been sent.",
    });
  };

  if (!user) return genericResponse();

  // generate reset token and send email
  // const resetToken = user.getResetPasswordToken();
  // await user.save({ validateBeforeSave: false });
  const resetToken = crypto.randomBytes(32).toString("hex");

  user.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  logger.info(`Password reset requested for: ${email}`);

  try {
    await sendResetEmail({ email: user.email, name: user.firstName, resetUrl });

    return res.status(HTTPS_STATUS.OK).json({
      success: true,
      message:
        "If that user email is registered, a password reset link has been sent.",
      // plain token visible in dev only - never in production
      ...(process.env.NODE_ENV === "development" && { resetToken, resetUrl }),
    });
  } catch (emailErr) {
    // email failed - clear the token so user can try again
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    logger.error(`Reset email failed for ${email}: ${emailErr.message}`);

    return next(
      createError(
        "Email could not be sent. Please try again later.",
        HTTPS_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.INTERNAL_ERROR,
      ),
    );
  }
};

// @desc    Reset Password
// @route   POST /api/v1/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    return next(
      createError(
        "Password and confirm password are required.",
        HTTPS_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
      ),
    );
  }

  if (password !== confirmPassword) {
    return next(
      createError(
        "Password do not match.",
        HTTPS_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
      ),
    );
  }

  if (password.length < 8) {
    return next(
      createError(
        "Password must be at least 8 characters.",
        HTTPS_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
      ),
    );
  }

  // Hash URL token to look up in DB
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    return next(
      createError(
        "Reset token is Invalid or expired.",
        HTTPS_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_TOKEN,
      ),
    );
  }

  // set new password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  logger.info(`Password reset successful for: ${user.email}`);

  // return fresh JWT so user is logged in immediately after resetting password
  sendTokenResponse(user, HTTPS_STATUS.OK, res);
};
