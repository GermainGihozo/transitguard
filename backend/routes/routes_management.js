const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validator");

/* CREATE ROUTE (Station to Station) */
router.post(
  "/",
  authMiddleware,
  roleMiddleware("company_admin", "super_admin", "station_officer"),
  validate({
    route_name: { required: true, minLength: 3, maxLength: 100 },
    origin_station_id: { required: true },
    destination_station_id: { required: true }
  }),
  async (req, res, next) => {
    const { route_name, origin_station_id, destination_station_id, distance_km, estimated_duration_minutes } = req.body;

    try {
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

      // Check for duplicate route
      const [existing] = await db.execute(
        "SELECT id FROM routes WHERE origin_station_id = ? AND destination_station_id = ?",
        [origin_station_id, destination_station_id]
      );

      if (existing.length > 0) {
        return res.status(409).json({ message: "Route already exists between these stations" });
      }

      const [result] = await db.execute(
        `INSERT INTO routes (route_name, origin_station_id, destination_station_id, distance_km, estimated_duration_minutes) 
         VALUES (?, ?, ?, ?, ?)`,
        [route_name, origin_station_id, destination_station_id, distance_km || null, estimated_duration_minutes || null]
      );

      res.status(201).json({
        message: "Route created successfully",
        route_id: result.insertId,
        route: {
          id: result.insertId,
          route_name,
          origin: originStation[0].name,
          destination: destStation[0].name
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/* GET ALL ROUTES */
router.get(
  "/",
  authMiddleware,
  roleMiddleware("company_admin", "super_admin", "station_officer", "authority", "conductor"),
  async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;
    const origin_station_id = req.query.origin_station_id;
    const is_active = req.query.is_active;

    try {
      let query = `
        SELECT 
          r.id,
          r.route_name,
          r.origin_station_id,
          r.destination_station_id,
          r.distance_km,
          r.estimated_duration_minutes,
          r.is_active,
          r.created_at,
          os.name as origin_name,
          os.location as origin_location,
          ds.name as destination_name,
          ds.location as destination_location
        FROM routes r
        JOIN stations os ON r.origin_station_id = os.id
        JOIN stations ds ON r.destination_station_id = ds.id
        WHERE 1=1
      `;

      const params = [];

      if (origin_station_id) {
        query += " AND r.origin_station_id = ?";
        params.push(origin_station_id);
      }

      if (is_active !== undefined) {
        query += " AND r.is_active = ?";
        params.push(is_active === 'true' ? 1 : 0);
      }

      query += " ORDER BY r.route_name ASC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const [routes] = await db.execute(query, params);

      // Get total count
      let countQuery = "SELECT COUNT(*) as total FROM routes WHERE 1=1";
      const countParams = [];

      if (origin_station_id) {
        countQuery += " AND origin_station_id = ?";
        countParams.push(origin_station_id);
      }

      if (is_active !== undefined) {
        countQuery += " AND is_active = ?";
        countParams.push(is_active === 'true' ? 1 : 0);
      }

      const [[{ total }]] = await db.execute(countQuery, countParams);

      res.json({
        routes,
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

/* GET ROUTE BY ID */
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("company_admin", "super_admin", "station_officer", "authority", "conductor"),
  async (req, res, next) => {
    try {
      const [routes] = await db.execute(
        `SELECT 
          r.*,
          os.name as origin_name,
          os.location as origin_location,
          ds.name as destination_name,
          ds.location as destination_location
         FROM routes r
         JOIN stations os ON r.origin_station_id = os.id
         JOIN stations ds ON r.destination_station_id = ds.id
         WHERE r.id = ?`,
        [req.params.id]
      );

      if (routes.length === 0) {
        return res.status(404).json({ message: "Route not found" });
      }

      res.json(routes[0]);
    } catch (error) {
      next(error);
    }
  }
);

/* UPDATE ROUTE */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("company_admin", "super_admin"),
  async (req, res, next) => {
    const { route_name, distance_km, estimated_duration_minutes, is_active } = req.body;

    try {
      const updates = [];
      const params = [];

      if (route_name) {
        updates.push("route_name = ?");
        params.push(route_name);
      }
      if (distance_km !== undefined) {
        updates.push("distance_km = ?");
        params.push(distance_km);
      }
      if (estimated_duration_minutes !== undefined) {
        updates.push("estimated_duration_minutes = ?");
        params.push(estimated_duration_minutes);
      }
      if (is_active !== undefined) {
        updates.push("is_active = ?");
        params.push(is_active);
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: "No fields to update" });
      }

      params.push(req.params.id);
      const sql = `UPDATE routes SET ${updates.join(", ")} WHERE id = ?`;

      const [result] = await db.execute(sql, params);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Route not found" });
      }

      res.json({ message: "Route updated successfully" });
    } catch (error) {
      next(error);
    }
  }
);

/* DELETE ROUTE */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("super_admin"),
  async (req, res, next) => {
    try {
      // Check if route has active trips
      const [trips] = await db.execute(
        "SELECT COUNT(*) as count FROM trips WHERE route_id = ? AND status IN ('scheduled', 'departed')",
        [req.params.id]
      );

      if (trips[0].count > 0) {
        return res.status(400).json({
          message: "Cannot delete route with active trips. Please cancel or complete trips first."
        });
      }

      const [result] = await db.execute(
        "DELETE FROM routes WHERE id = ?",
        [req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Route not found" });
      }

      res.json({ message: "Route deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
