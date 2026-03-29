const jwt = require("jsonwebtoken");
const { HTTPS_STATUS, ERROR_CODES, ROLES } = require("../utils/constants");
const User = require("../models/User");
const { createError, asyncHandler } = require("./errorHandler");

// protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(
      createError(
        "Not authorized to access this resource",
        HTTPS_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED,
      ),
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return next(
        createError(
          "User no longer exists",
          HTTPS_STATUS.UNAUTHORIZED,
          ERROR_CODES.UNAUTHORIZED,
        ),
      );
    }

    if (req.user.status !== "active") {
      return next(
        createError(
          "Your account has been deactivated. Please contact support.",
          HTTPS_STATUS.FORBIDDEN,
          ERROR_CODES.FORBIDDEN,
        ),
      );
    }

    next();
  } catch (err) {
    return next(
      createError(
        "Not authorized to access this resource",
        HTTPS_STATUS.UNAUTHORIZED,
        ERROR_CODES.INVALID_TOKEN,
      ),
    );
  }
});

// grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        createError(
          `User role '${req.user.role}' is not authorized to access this resource`,
          HTTPS_STATUS.FORBIDDEN,
          ERROR_CODES.FORBIDDEN,
        ),
      );
    }
    next();
  };
};

// check if user belongs to the organization
exports.checkOrganization = asyncHandler(async (req, res, next) => {
  const oranizationId = req.params.organizationId || req.body.organizationId;

  if (!oranizationId) return next();

  if (req.user.role === ROLES.SUPER_ADMIN) return next();

  if (!req.user.organizations.includes(oranizationId)) {
    return next(
      createError(
        "You do not have access to this organization",
        HTTPS_STATUS.FORBIDDEN,
        ERROR_CODES.FORBIDDEN,
      ),
    );
  }

  next();
});

// check if user belongs to the branch
exports.checkBranch = asyncHandler(async (req, res, next) => {
  const branchId = req.params.branchId || req.body.branchId;

  if (!branchId) return next();

  if ([ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(req.user.role)) return next();

  if (req.user.branchId && req.user.branchId.toString() !== branchId) {
    return next(
      createError(
        "Not authorized to access this branch",
        HTTPS_STATUS.FORBIDDEN,
        ERROR_CODES.FORBIDDEN,
      ),
    );
  }

  next();
});

// optional authentication - doesnt fail is no token
exports.optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch (err) {
      // If token is invalid, we just proceed without setting req.user
      req.user = null;
    }
  }

  next();
});
