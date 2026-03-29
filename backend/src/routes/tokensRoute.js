const express = require("express");
const router = express.Router();
const { protect, authorize, optionalAuth } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validation");
const { ROLES } = require("../utils/constants");
const { tokenLimiter } = require("../middleware/rateLimiter");
const queueController = require("../controllers/queueController");

// public routes
router.post(
  "/",
  tokenLimiter,
  validate(schemas.tokenGeneration),
  queueController.generateToken,
);
router.get("/queue/:branchId", queueController.getQueueStatus);
router.get("/check/:tokenNumber/:branchId", queueController.getTokenByNumber);
router.get("/serving/:branchId", queueController.getCurrentlyServing);

// protected routes - admins & staff
router.post(
  "/call-next",
  protect,
  authorize(ROLES.ADMIN, ROLES.STAFF),
  queueController.callNextToken,
);
router.post(
  "/:id/serve",
  protect,
  authorize(ROLES.ADMIN, ROLES.STAFF),
  queueController.startServing,
);
router.post(
  "/:id/complete",
  protect,
  authorize(ROLES.ADMIN, ROLES.STAFF),
  queueController.completeService,
);
router.post(
  "/:id/no-show",
  protect,
  authorize(ROLES.ADMIN, ROLES.STAFF),
  queueController.markNoShow,
);
router.post(
  "/:id/transfer",
  protect,
  authorize(ROLES.ADMIN, ROLES.STAFF),
  queueController.transferToken,
);

// mixed routes - public or customer's own
router.post("/:id/cancel", optionalAuth, queueController.cancelToken);

// protected routes - admin/staff list view
router.get(
  "/",
  protect,
  authorize(ROLES.ADMIN, ROLES.STAFF),
  queueController.getTokens,
);

// customer routes
router.get(
  "/my-tokens",
  protect,
  authorize(ROLES.CUSTOMER),
  queueController.getMyTokens,
);

module.exports = router;
