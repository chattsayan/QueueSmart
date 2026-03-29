const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const serviceController = require("../controllers/serviceController");
const { validate, schemas } = require("../middleware/validation");
const { ROLES } = require("../utils/constants");

// public routes
router.get("/", serviceController.getServices);
router.get("/:id", serviceController.getService);

// protected routes - admins only
router.use(protect);
router.use(authorize(ROLES.ADMIN));

router.post(
  "/",
  validate(schemas.createService),
  serviceController.createService,
);
router.put("/:id", serviceController.updateService);
router.delete("/:id", serviceController.deleteService);
router.put("/:id/toggle", serviceController.toggleService);

module.exports = router;
