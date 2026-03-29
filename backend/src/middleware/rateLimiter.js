const rateLimit = require("express-rate-limit");
const { HTTPS_STATUS, ERROR_CODES } = require("../utils/constants");

// API rate limiter
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: "false",
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: "Too many requests from this IP, please try again later.",
    },
  },
  statusCode: HTTPS_STATUS.TOO_MANY_REQUESTS,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(HTTPS_STATUS.TOO_MANY_REQUESTS).json({
      success: "false",
      error: {
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: "Too many requests from this IP, please try again later.",
      },
    });
  },
});

// rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  skipSuccessfulRequests: true, // Only count failed requests
  message: {
    success: "false",
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: "Too many requests from this IP, please try again later.",
    },
  },
  statusCode: HTTPS_STATUS.TOO_MANY_REQUESTS,
});

// token generation rate limiter
const tokenLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: "false",
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: "Too many requests from this IP, please try again later.",
    },
  },
  statusCode: HTTPS_STATUS.TOO_MANY_REQUESTS,
});

// export rate limiters
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: "false",
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: "Too many requests from this IP, please try again later.",
    },
  },
  statusCode: HTTPS_STATUS.TOO_MANY_REQUESTS,
});

module.exports = {
  apiLimiter,
  authLimiter,
  tokenLimiter,
  exportLimiter,
};
