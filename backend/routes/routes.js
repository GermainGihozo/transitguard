const express = require("express");
const router = express.Router();

console.log("Loading API routes...");

// Import all route modules
const authRoutes = require("./auth");
const usersRoutes = require("./users");
const stationsRoutes = require("./stations");
const routesManagementRoutes = require("./routes_management");
const passengerRoutes = require("./passengerRoutes");
const boardingRoutes = require("./boardingRoutes");
const dashboardRoutes = require("./dashboard");
const tripsRoutes = require("./trips");
const tripsDashboardRoutes = require("./trips_dashboard");
const vehiclesRoutes = require("./vehicles");
const ticketsRoutes = require("./tickets");
const scanRoutes = require("./scan");

console.log("All route modules imported successfully");

// Mount routes
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/stations", stationsRoutes);
router.use("/routes", routesManagementRoutes);
router.use("/passengers", passengerRoutes);
router.use("/boarding", boardingRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/trips", tripsRoutes);
router.use("/trips", tripsDashboardRoutes);
router.use("/vehicles", vehiclesRoutes);
router.use("/tickets", ticketsRoutes);
router.use("/scan", scanRoutes);

console.log("All routes mounted successfully");

module.exports = router;
