const express = require("express");
const router = express.Router();
const { registerPassenger } = require("../controllers/passengerController");
const { verifyToken } = require("../../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.post(
  "/register",
  verifyToken,
  authorizeRoles("station_officer", "company_admin", "super_admin"),
  registerPassenger
);

module.exports = router;
