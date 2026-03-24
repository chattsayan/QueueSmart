module.exports = {
  // API Configuration
  API_VERSION: "v1",

  // Pagination
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,

  // Token Configuration
  TOKEN_PREFIX: {
    GENERAL: "A",
    VIP: "V",
    PRIORITY: "P",
  },

  // User Roles
  ROLES: {
    SUPER_ADMIN: "superadmin",
    ADMIN: "admin",
    STAFF: "staff",
    CUSTOMER: "customer",
  },

  // Token Status
  TOKEN_STATUS: {
    WAITING: "waiting",
    CALLED: "called",
    SERVING: "serving",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    NO_SHOW: "no-show",
  },

  // Priority Levels
  PRIORITY: {
    NORMAL: "normal",
    HIGH: "high",
    VIP: "vip",
  },

  // Counter Status
  COUNTER_STATUS: {
    AVAILABLE: "available",
    BUSY: "busy",
    OFFLINE: "offline",
    BREAK: "break",
  },

  // User Status
  USER_STATUS: {
    ACTIVE: "active",
    INACTIVE: "inactive",
    SUSPENDED: "suspended",
  },

  //   Notification Types
  NOTIFICATION_TYPES: {
    SMS: "sms",
    EMAIL: "email",
    PUSH: "push",
  },

  //   Notification Status
  NOTIFICATION_STATUS: {
    PENDING: "pending",
    SENT: "sent",
    FAILED: "failed",
  },

  //   Subscription Plans
  SUBSCRIPTION_PLANS: {
    BASIC: "basic",
    PREMIUM: "premium",
    ENTERPRISE: "enterprise",
  },

  //   http status codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },

  //   Error Codes
  ERROR_CODES: {
    VALIDATION_ERROR: "VALIDATION_ERROR",
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    NOT_FOUND: "NOT_FOUND",
    CONFLICT: "CONFLICT",
    RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
    INTERNAL_ERROR: "INTERNAL_ERROR",
    SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
    INVALID_TOKEN: "INVALID_TOKEN",
    TOKEN_EXPIRED: "TOKEN_EXPIRED",
  },

  //   Cache TTL (in seconds)
  CACHE_TTL: {
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 3600, // 1 hour
    VERY_LONG: 86400, // 24 hours
  },

  //   Queue Settings
  QUEUE_SETTINGS: {
    DEFAULT_SERVICE_TIME: 10, // minutes
    NO_SHOW_TIMEOUT: 5, // minutes
    MAX_TOKENS_PER_DAY: 1000,
  },
};
