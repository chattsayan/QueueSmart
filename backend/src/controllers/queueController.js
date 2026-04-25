const queueService = require("../services/queueService");
const Token = require("../models/Token");
const Counter = require("../models/Counter");
const { asyncHandler, createError } = require("../middleware/errorHandler");
const { HTTP_STATUS, TOKEN_STATUS } = require("../utils/constants");
const {
  successResponse,
  getPaginationParams,
  buildPaginationResponse,
} = require("../utils/helpers");
const { notifyTurnApproaching } = require("../services/notificationService");
const { emitToService, emitToBranch, emitToUser } = require("../utils/socket");

// @desc    Generate new token (join queue)
// @route   POST /api/v1/tokens
// @access  Public
exports.generateToken = asyncHandler(async (req, res, next) => {
  const token = await queueService.generateToken({
    ...req.body,
    customerId: req.user.id, // if user is logged in
  });

  emitToService(token.serviceId.toString(), "token:new", {
    token,
    message: `New token ${token.tokenNumber} generated`,
  });

  emitToBranch(token.branchId.toString(), "queue:update", {
    serviceId: token.serviceId,
    action: "token_generated",
    token,
  });

  // notify customer if logged in
  if (token.customerId) {
    emitToUser(token.customerId.toString(), "notification:new", {});
  }
});
