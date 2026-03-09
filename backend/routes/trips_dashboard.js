const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

/* GET LIVE TRIPS OVERVIEW */
router.get(
  "/live-trips",
  authMiddleware,
  roleMiddleware("super_admin", "authority", "company_admin", "station_officer"),
  async (req, res, next) => {
    try {
      const [trips] = await db.execute(`
        SELECT 
          t.id,
          t.status,
          t.departure_time,
          v.plate_number,
          v.capacity,
          v.company_name,
          r.route_name,
          COUNT(DISTINCT bh.id) AS onboard
        FROM trips t
        JOIN vehicles v ON t.vehicle_id = v.id
        LEFT JOIN routes r ON t.route_id = r.id
        LEFT JOIN boarding_history bh 
          ON bh.trip_id = t.id 
          AND bh.status = 'approved'
        WHERE t.status IN ('scheduled','departed')
        GROUP BY t.id, t.status, t.departure_time, v.plate_number, v.capacity, v.company_name, r.route_name
        ORDER BY t.departure_time ASC
      `);

      res.json(trips);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
