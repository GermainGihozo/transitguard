const express = require("express");
const db = require("../config/db");
const { validate } = require("../middleware/validator");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

/* ================= CREATE STATION ================= */
router.post(
  "/",
  authMiddleware,
  roleMiddleware("super_admin", "company_admin"),
  validate({
    name: { required: true, minLength: 2, maxLength: 100 },
    location: { required: true, minLength: 2, maxLength: 200 }
  }),
  async (req, res, next) => {
    const { name, location, city, region, latitude, longitude, company_id } = req.body;

    try {
      // Check if station name already exists
      const [existing] = await db.execute(
        "SELECT id FROM stations WHERE name = ? AND location = ?",
        [name, location]
      );

      if (existing.length > 0) {
        return res.status(409).json({ message: "Station already exists at this location" });
      }

      const sql = `
        INSERT INTO stations 
        (name, location, city, region, latitude, longitude, company_id, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.execute(sql, [
        name,
        location,
        city || null,
        region || null,
        latitude || null,
        longitude || null,
        company_id || null,
        req.user.id
      ]);

      res.status(201).json({
        message: "Station created successfully",
        station: {
          id: result.insertId,
          name,
          location,
          city,
          region
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/* ================= GET ALL STATIONS ================= */
router.get(
  "/",
  authMiddleware,
  async (req, res, next) => {
    try {
      const { search, city, region, is_active, page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      let sql = `
        SELECT 
          s.*,
          u.full_name as created_by_name,
          COUNT(DISTINCT us.id) as assigned_officers
        FROM stations s
        LEFT JOIN users u ON s.created_by = u.id
        LEFT JOIN users us ON us.station_id = s.id
        WHERE 1=1
      `;
      const params = [];

      // Search filter
      if (search) {
        sql += " AND (s.name LIKE ? OR s.location LIKE ? OR s.city LIKE ?)";
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // City filter
      if (city) {
        sql += " AND s.city = ?";
        params.push(city);
      }

      // Region filter
      if (region) {
        sql += " AND s.region = ?";
        params.push(region);
      }

      // Active filter
      if (is_active !== undefined) {
        sql += " AND s.is_active = ?";
        params.push(is_active === 'true' ? 1 : 0);
      }

      sql += " GROUP BY s.id ORDER BY s.name ASC LIMIT ? OFFSET ?";
      params.push(parseInt(limit), parseInt(offset));

      const [stations] = await db.execute(sql, params);

      // Get total count
      let countSql = "SELECT COUNT(*) as total FROM stations WHERE 1=1";
      const countParams = [];

      if (search) {
        countSql += " AND (name LIKE ? OR location LIKE ? OR city LIKE ?)";
        const searchTerm = `%${search}%`;
        countParams.push(searchTerm, searchTerm, searchTerm);
      }
      if (city) {
        countSql += " AND city = ?";
        countParams.push(city);
      }
      if (region) {
        countSql += " AND region = ?";
        countParams.push(region);
      }
      if (is_active !== undefined) {
        countSql += " AND is_active = ?";
        countParams.push(is_active === 'true' ? 1 : 0);
      }

      const [countResult] = await db.execute(countSql, countParams);

      res.json({
        stations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/* ================= GET STATION BY ID ================= */
router.get(
  "/:id",
  authMiddleware,
  async (req, res, next) => {
    try {
      const [stations] = await db.execute(
        `SELECT 
          s.*,
          u.full_name as created_by_name,
          COUNT(DISTINCT us.id) as assigned_officers
        FROM stations s
        LEFT JOIN users u ON s.created_by = u.id
        LEFT JOIN users us ON us.station_id = s.id
        WHERE s.id = ?
        GROUP BY s.id`,
        [req.params.id]
      );

      if (stations.length === 0) {
        return res.status(404).json({ message: "Station not found" });
      }

      // Get assigned officers
      const [officers] = await db.execute(
        `SELECT id, full_name, email, role 
         FROM users 
         WHERE station_id = ? AND is_active = TRUE`,
        [req.params.id]
      );

      res.json({
        ...stations[0],
        officers
      });
    } catch (error) {
      next(error);
    }
  }
);

/* ================= UPDATE STATION ================= */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("super_admin", "company_admin"),
  validate({
    name: { minLength: 2, maxLength: 100 },
    location: { minLength: 2, maxLength: 200 }
  }),
  async (req, res, next) => {
    try {
      const { name, location, city, region, latitude, longitude, is_active } = req.body;
      const stationId = req.params.id;

      // Check if station exists
      const [existing] = await db.execute(
        "SELECT id FROM stations WHERE id = ?",
        [stationId]
      );

      if (existing.length === 0) {
        return res.status(404).json({ message: "Station not found" });
      }

      const updates = [];
      const params = [];

      if (name) {
        updates.push("name = ?");
        params.push(name);
      }
      if (location) {
        updates.push("location = ?");
        params.push(location);
      }
      if (city !== undefined) {
        updates.push("city = ?");
        params.push(city);
      }
      if (region !== undefined) {
        updates.push("region = ?");
        params.push(region);
      }
      if (latitude !== undefined) {
        updates.push("latitude = ?");
        params.push(latitude);
      }
      if (longitude !== undefined) {
        updates.push("longitude = ?");
        params.push(longitude);
      }
      if (is_active !== undefined) {
        updates.push("is_active = ?");
        params.push(is_active);
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: "No fields to update" });
      }

      params.push(stationId);
      const sql = `UPDATE stations SET ${updates.join(", ")} WHERE id = ?`;

      await db.execute(sql, params);

      res.json({ message: "Station updated successfully" });
    } catch (error) {
      next(error);
    }
  }
);

/* ================= DELETE STATION ================= */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("super_admin", "company_admin"),
  async (req, res, next) => {
    try {
      const stationId = req.params.id;

      // Check if station has assigned officers
      const [officers] = await db.execute(
        "SELECT COUNT(*) as count FROM users WHERE station_id = ?",
        [stationId]
      );

      if (officers[0].count > 0) {
        return res.status(400).json({
          message: "Cannot delete station with assigned officers. Please reassign them first."
        });
      }

      // Soft delete
      await db.execute(
        "UPDATE stations SET is_active = FALSE WHERE id = ?",
        [stationId]
      );

      res.json({ message: "Station deactivated successfully" });
    } catch (error) {
      next(error);
    }
  }
);

/* ================= GET CITIES ================= */
router.get(
  "/meta/cities",
  authMiddleware,
  async (req, res, next) => {
    try {
      const [cities] = await db.execute(
        "SELECT DISTINCT city FROM stations WHERE city IS NOT NULL ORDER BY city"
      );

      res.json(cities.map(c => c.city));
    } catch (error) {
      next(error);
    }
  }
);

/* ================= GET REGIONS ================= */
router.get(
  "/meta/regions",
  authMiddleware,
  async (req, res, next) => {
    try {
      const [regions] = await db.execute(
        "SELECT DISTINCT region FROM stations WHERE region IS NOT NULL ORDER BY region"
      );

      res.json(regions.map(r => r.region));
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
