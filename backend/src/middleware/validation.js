const Joi = require("joi");
const { HTTPS_STATUS, ERROR_CODES } = require("../utils/constants");
const { createError } = require("./errorHandler");

const validate = (schema) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false, // Return all errors
      allowUnknown: true, // Allow unknown keys
      stripUnknown: true, // Remove unknown keys
    };

    const { error, value } = schema.validate(req.body, validationOptions);

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message.replace(/["]/g, ""),
      }));

      return next(
        createError(
          "Validation failed",
          HTTPS_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR,
        ),
      );
    }

    req.body = value; // Use the validated and sanitized data
    next();
  };
};

const schemas = {
  pagiantion: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string(),
  }),

  // mongodb object
  objectId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),

  email: Joi.string().email().lowercase().trim(),

  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .message(
      "Password must contain at least one uppercase letter, one lowercase letter, and one digit.",
    ),

  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),

  date: Joi.date().iso(),

  tokenGeneration: Joi.object({
    branchId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    serviceId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    customerName: Joi.string().max(100),
    customerPhone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
    priority: Joi.string().valid("normal", "high", "vip").default("normal"),
    appointmentTime: Joi.date().iso(),
    isVirtualQueue: Joi.boolean().default(false),
  }),

  userRegister: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required(),
    firstName: Joi.string().min(2).max(50).trim().required(),
    lastName: Joi.string().min(2).max(50).trim().required(),
    phone: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .required(),
    role: Joi.string().valid("admin", "staff", "customer").default("customer"),
    organizationId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
    branchId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  }),

  userLogin: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string().required(),
  }),

  serviceCreate: Joi.object({
    branchId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    name: Joi.string().min(3).max(100).trim().required(),
    description: Joi.string().max(500),
    category: Joi.string().max(50),
    estimatedServiceTime: Joi.number().integer().min(1).max(300).required(), // in minutes
    tokenPrefix: Joi.string().length(1).uppercase().required(),
    priority: Joi.number().integer().min(0).default(0), // 0 for normal, higher for higher priority
    isActive: Joi.boolean().default(true),
    color: Joi.string().pattern(/^#([0-9A-F]{6})$/i),
    icon: Joi.string().max(50),
    settings: Joi.object({
      requiresAppointment: Joi.boolean().default(false),
      maxConcurrentTokens: Joi.number().integer().min(1),
      allowPriority: Joi.boolean().default(false),
    }),
  }),

  //   brancd creation
  branchCreate: Joi.object({
    organizationId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    name: Joi.string().min(3).max(100).trim().required(),
    code: Joi.string().min(2).max(20).trim().required(),
    contactEmail: Joi.string().email().lowercase().trim(),
    contactPhone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
    address: Joi.object({
      street: Joi.string().max(200),
      city: Joi.string().max(100),
      state: Joi.string().max(100),
      zipCode: Joi.string().max(20),
    }),
    isActive: Joi.boolean().default(true),
  }),

  //   counter creation
  counterCreate: Joi.object({
    branchId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    number: Joi.number().integer().min(1).required(),
    name: Joi.string().max(100),
    assignedServices: Joi.array().items(
      Joi.string().regex(/^[0-9a-fA-F]{24}$/),
    ),
    assignedStaff: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
    status: Joi.string()
      .valid("available", "busy", "offline", "break")
      .default("offline"),
    isActive: Joi.boolean().default(true),
  }),
};

module.exports = {
  validate,
  schemas,
};
