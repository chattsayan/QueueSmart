const { HTTP_STATUS } = require("./constants");
const moment = require("moment-timezone");

/**
 * Success response helper
 */
exports.successResponse = (
  res,
  data,
  message = "Success",
  statusCode = HTTP_STATUS.OK,
) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Pagination helper
 */
exports.getPaginationParams = (req) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * build pagination response
 */
exports.buildPaginationResponse = (data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      totalPages,
      totalItems: total,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

/**
 * Filter object by allowed fields
 */
exports.filterObject = (obj, allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
};

/**
 * generate random string
 */
exports.generateRandomString = (length = 32) => {
  return require("crypto").randomBytes(length).toString("hex").slice(0, length);
};

/**
 * sanitize user object (remove sensitive fields)
 */
exports.sanitizeUser = (user) => {
  const userObject = user.toObject ? user.toObject() : user;
  delete userObject.password;
  delete userObject.passwordResetToken;
  delete userObject.emailVerificationToken;
  return userObject;
};

/**
 * calculate time difference in minutes
 */
exports.getTimeDifferenceInMinutes = (startTime, endTime = new Date()) => {
  const diff = endTime - startTime;
  return Math.round(diff / 1000 / 60);
};

/**
 * format date for display
 */
exports.formatDate = (date, format = "YYYY-MM-DD HH:mm:ss") => {
  return moment(date)
    .tz(process.env.TIMEZONE || "UTC")
    .format(format);
};

/**
 * deep clone object
 */
exports.deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * check if value is empty
 */
exports.isEmpty = (value) => {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "object" && Object.keys(value).length === 0) ||
    (typeof value === "string" && value.trim().length === 0)
  );
};

/**
 * sleep/delay function
 */
exports.sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * retry function with exponential backoff
 */
exports.retryWithBackoff = async (fn, maxRetries = 5, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, i);
      await exports.sleep(delay);
    }
  }
};

/**
 * parse sort query parameter
 */
exports.parseSortParam = (sortString) => {
  if (!sortString) return null;

  const sortObj = {};

  sortString.split(",").forEach((field) => {
    if (field.startsWith("-")) {
      sortObj[field.substring(1)] = -1;
    } else {
      sortObj[field] = 1;
    }
  });

  return sortObj;
};

/**
 * build query filters
 */
exports.buildQueryFilters = (query, allowedFields = []) => {
  const filters = {};

  allowedFields.forEach((field) => {
    if (query[field] !== undefined) {
      filters[field] = query[field];
    }
  });
  return filters;
};
