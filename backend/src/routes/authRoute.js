const express = require("express");
const router = express.Router();
const { validate, schemas } = require("../middleware/validation");
const { asyncHandler } = require("../middleware/errorHandler");
const { authLimiter } = require("../middleware/rateLimiter");
const { protect } = require("../middleware/auth");
const { authController } = require("../controllers/authController");

// public routes
router.post(
  "/register",
  authLimiter,
  validate(schemas.userRegister),
  asyncHandler(authController.register),
);

router.post(
  "/login",
  authLimiter,
  validate(schemas.userLogin),
  asyncHandler(authController.login),
);

router.post("/logout", asyncHandler(authController.logout));

router.post("/refresh-token", asyncHandler(authController.refreshToken));

router.post(
  "/forgot-password",
  authLimiter,
  asyncHandler(authController.forgotPassword),
);

router.post(
  "/reset-password/:token",
  authLimiter,
  asyncHandler(authController.resetPassword),
);

// protected routes
router.use(protect);

router.get("/me", asyncHandler(authController.getMe));

router.put("/me", asyncHandler(authController.updateProfile));

router.put("/change-password", asyncHandler(authController.changePassword));

module.exports = router;
