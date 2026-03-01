const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validator");

/* CREATE TRIP */
router.post(
  "/",
  authMiddleware,
  roleMiddleware("company_admin", "super_admin", "station_officer"),
  validate({
    vehicle_id: { required: true },
    origin_station_id: { required: true },
    destination_station_id: { required: true },
    departure_time: { required: true }
  }),
  async (req, res, next) => {
    const { vehicle_id, origin_station_id, destination_station_id, departure_time } = req.body;

    try {
      // Verify vehicle exists
      const [vehicle] = await db.execute(
        "SELECT id, capacity FROM vehicles WHERE id = ?",
        [vehicle_id]
      );

      if (vehicle.length === 0) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      // Verify stations exist
      const [originStation] = await db.execute(
        "SELECT id, name FROM stations WHERE id = ? AND is_active = TRUE",
        [origin_station_id]
      );

      const [destStation] = await db.execute(
        "SELECT id, name FROM stations WHERE id = ? AND is_active = TRUE",
        [destination_station_id]
      );

      if (originStation.length === 0) {
        return res.status(404).json({ message: "Origin station not found or inactive" });
      }

      if (destStation.length === 0) {
        return res.status(404).json({ message: "Destination station not found or inactive" });
      }

      if (origin_station_id === destination_station_id) {
        return res.status(400).json({ message: "Origin and destination cannot be the same" });
      }

      // Check if route exists, if not create it automatically
      let [routes] = await db.execute(
        "SELECT id FROM routes WHERE origin_station_id = ? AND destination_station_id = ?",
        [origin_station_id, destination_station_id]
      );

      let route_id;
      if (routes.length === 0) {
        // Auto-create route
        const route_name = `${originStation[0].name} to ${destStation[0].name}`;
        const [routeResult] = await db.execute(
          `INSERT INTO routes (route_name, origin_station_id, destination_station_id) 
           VALUES (?, ?, ?)`,
          [route_name, origin_station_id, destination_station_id]
        );
        route_id = routeResult.insertId;
      } else {
        route_id = routes[0].id;
      }

      // Create trip
      const [result] = await db.execute(
        `INSERT INTO trips (vehicle_id, route_id, departure_time, status) 
         VALUES (?, ?, ?, 'scheduled')`,
        [vehicle_id, route_id, departure_time]
      );

      res.status(201).json({
        message: "Trip scheduled successfully",
        trip_id: result.insertId,
        route_id: route_id
      });
    } catch (error) {
      next(error);
    }
  }
);

/* GET ALL TRIPS */
router.get(
  "/",
  authMiddleware,
  roleMiddleware("company_admin", "super_admin", "station_officer", "authority", "conductor"),
  async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const status = req.query.status; // Filter by status if provided
    const station_id = req.query.station_id; // Filter by station

    try {
      let query = `
        SELECT 
          t.id,
          t.vehicle_id,
          t.route_id,
          t.departure_time,
          t.status,
          t.created_at,
          v.plate_number,
          v.company_name,
          v.capacity,
          r.route_name,
          os.id as origin_station_id,
          os.name as origin_station,
          ds.id as destination_station_id,
          ds.name as destination_station,
          COUNT(DISTINCT tk.id) as tickets_sold,
          COUNT(DISTINCT CASE WHEN tk.is_used = TRUE THEN tk.id END) as passengers_boarded
        FROM trips t
        JOIN vehicles v ON t.vehicle_id = v.id
        JOIN routes r ON t.route_id = r.id
        JOIN stations os ON r.origin_station_id = os.id
        JOIN stations ds ON r.destination_station_id = ds.id
        LEFT JOIN tickets tk ON t.id = tk.trip_id
        WHERE 1=1
      `;

      const params = [];

      if (status) {
        query += " AND t.status = ?";
        params.push(status);
      }

      if (station_id) {
        query += " AND (r.origin_station_id = ? OR r.destination_station_id = ?)";
        params.push(station_id, station_id);
      }

      query += " GROUP BY t.id ORDER BY t.departure_time DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const [trips] = await db.execute(query, params);

      // Get total count
      let countQuery = "SELECT COUNT(DISTINCT t.id) as total FROM trips t JOIN routes r ON t.route_id = r.id WHERE 1=1";
      const countParams = [];

      if (status) {
        countQuery += " AND t.status = ?";
        countParams.push(status);
      }

      if (station_id) {
        countQuery += " AND (r.origin_station_id = ? OR r.destination_station_id = ?)";
        countParams.push(station_id, station_id);
      }

      const [[{ total }]] = await db.execute(countQuery, countParams);

      res.json({
        trips,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/* GET TRIP BY ID */
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("company_admin", "super_admin", "station_officer", "authority", "conductor"),
  async (req, res, next) => {
    try {
      const [trips] = await db.execute(
        `SELECT 
          t.*,
          v.plate_number,
          v.company_name,
          v.capacity,
          r.route_name,
          os.id as origin_station_id,
          os.name as origin_station,
          ds.id as destination_station_id,
          ds.name as destination_station,
          COUNT(DISTINCT tk.id) as tickets_sold,
          COUNT(DISTINCT CASE WHEN tk.is_used = TRUE THEN tk.id END) as passengers_boarded
         FROM trips t
         JOIN vehicles v ON t.vehicle_id = v.id
         JOIN routes r ON t.route_id = r.id
         JOIN stations os ON r.origin_station_id = os.id
         JOIN stations ds ON r.destination_station_id = ds.id
         LEFT JOIN tickets tk ON t.id = tk.trip_id
         WHERE t.id = ?
         GROUP BY t.id`,
        [req.params.id]
      );

      if (trips.length === 0) {
        return res.status(404).json({ message: "Trip not found" });
      }

      res.json(trips[0]);
    } catch (error) {
      next(error);
    }
  }
);

/* UPDATE TRIP STATUS */
router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("company_admin", "super_admin", "station_officer", "conductor"),
  validate({
    status: { required: true }
  }),
  async (req, res, next) => {
    const { status } = req.body;
    const validStatuses = ["scheduled", "departed", "arrived", "cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
        valid_statuses: validStatuses
      });
    }

    try {
      const [result] = await db.execute(
        "UPDATE trips SET status = ? WHERE id = ?",
        [status, req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Trip not found" });
      }

      res.json({ message: "Trip status updated successfully" });
    } catch (error) {
      next(error);
    }
  }
);

/* DELETE TRIP */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("company_admin", "super_admin"),
  async (req, res, next) => {
    try {
      const [result] = await db.execute(
        "DELETE FROM trips WHERE id = ?",
        [req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Trip not found" });
      }

      res.json({ message: "Trip deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
