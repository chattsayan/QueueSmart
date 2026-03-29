const logger = require("../utils/logger");
const { HTTPS_STATUS, ERROR_CODES } = require("../utils/constants");

const createError = (message, statusCode, errorCode = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.errorCode = errorCode;
  error.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
  error.isOperational = true; // Mark as operational error for better error handling
  return error;
};

// error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || HTTPS_STATUS.INTERNAL_SERVER_ERROR;

  // Log Error
  logger.error(`Error: ${error.message}`, {
    statusCode: error.statusCode,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Mongoose bad object id
  if (err.name === "CastError") {
    error = createError(
      "Resource not found",
      HTTPS_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
    );
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = createError(
      message,
      HTTPS_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors)
      .map((val) => val.message)
      .join(". ");
    error = createError(
      messages,
      HTTPS_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  // JWT error
  if (err.name === "JsonWebTokenError") {
    error = createError(
      "Invalid token. Please login again.",
      HTTPS_STATUS.UNAUTHORIZED,
      ERROR_CODES.INVALID_TOKEN,
    );
  }

  if (err.name === "TokenExpiredError") {
    error = createError(
      "Token expired. Please login again.",
      HTTPS_STATUS.UNAUTHORIZED,
      ERROR_CODES.TOKEN_EXPIRED,
    );
  }

  // Send error response
  res.status(error.statusCode).json({
    success: false,
    error: {
      code: error.errorCode || ERROR_CODES.INTERNAL_ERROR,
      message: error.message || "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    },
    timestamp: new Date().toISOString(),
  });
};

// Not found handler
const notFound = (req, res, next) => {
  next(
    createError(
      `Route not found: ${req.originalUrl}`,
      HTTPS_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
    ),
  );
};

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  createError,
  errorHandler,
  notFound,
  asyncHandler,
};
