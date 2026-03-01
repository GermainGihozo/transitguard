const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// GET LIVE DASHBOARD DATA
router.get(
  "/live",
  authMiddleware,
  roleMiddleware("super_admin", "company_admin", "station_officer", "authority"),
  async (req, res, next) => {
    try {
      // Today's stats
      const [stats] = await db.execute(`
        SELECT
          COUNT(*) as total_scans,
          SUM(status = 'approved') as approved,
          SUM(status = 'denied') as denied
        FROM boarding_history
        WHERE DATE(scan_time) = CURDATE()
      `);

      // Latest 10 boarding records
      const [records] = await db.execute(`
        SELECT 
          bh.scan_time,
          bh.status,
          p.full_name,
          t.seat_number
        FROM boarding_history bh
        JOIN passengers p ON bh.passenger_id = p.id
        LEFT JOIN tickets t ON bh.ticket_id = t.id
        ORDER BY bh.scan_time DESC
        LIMIT 10
      `);

      res.json({
        stats: stats[0],
        records
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;