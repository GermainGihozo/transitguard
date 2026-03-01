const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validator");

/* CREATE VEHICLE */
router.post(
  "/",
  authMiddleware,
  roleMiddleware("company_admin", "super_admin"),
  validate({
    plate_number: { required: true, minLength: 3, maxLength: 20 },
    company_name: { required: true, minLength: 2, maxLength: 100 },
    capacity: { required: true }
  }),
  async (req, res, next) => {
    const { plate_number, company_name, capacity } = req.body;

    try {
      // Check for duplicate plate number
      const [existing] = await db.execute(
        "SELECT id FROM vehicles WHERE plate_number = ?",
        [plate_number]
      );

      if (existing.length > 0) {
        return res.status(409).json({ message: "Plate number already registered" });
      }

      const [result] = await db.execute(
        "INSERT INTO vehicles (plate_number, company_name, capacity) VALUES (?, ?, ?)",
        [plate_number, company_name, capacity]
      );

      res.status(201).json({
        message: "Vehicle registered successfully",
        vehicle_id: result.insertId
      });
    } catch (error) {
      next(error);
    }
  }
);

/* GET ALL VEHICLES */
router.get(
  "/",
  authMiddleware,
  roleMiddleware("company_admin", "super_admin", "station_officer", "authority"),
  async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    try {
      const [vehicles] = await db.execute(
        `SELECT id, plate_number, company_name, capacity, created_at 
         FROM vehicles 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      const [[{ total }]] = await db.execute(
        "SELECT COUNT(*) as total FROM vehicles"
      );

      res.json({
        vehicles,
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

/* GET VEHICLE BY ID */
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("company_admin", "super_admin", "station_officer", "authority"),
  async (req, res, next) => {
    try {
      const [vehicles] = await db.execute(
        "SELECT * FROM vehicles WHERE id = ?",
        [req.params.id]
      );

      if (vehicles.length === 0) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      res.json(vehicles[0]);
    } catch (error) {
      next(error);
    }
  }
);

/* UPDATE VEHICLE */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("company_admin", "super_admin"),
  async (req, res, next) => {
    const { plate_number, company_name, capacity } = req.body;

    try {
      const [result] = await db.execute(
        `UPDATE vehicles 
         SET plate_number = COALESCE(?, plate_number),
             company_name = COALESCE(?, company_name),
             capacity = COALESCE(?, capacity)
         WHERE id = ?`,
        [plate_number, company_name, capacity, req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      res.json({ message: "Vehicle updated successfully" });
    } catch (error) {
      next(error);
    }
  }
);

/* DELETE VEHICLE */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("super_admin"),
  async (req, res, next) => {
    try {
      const [result] = await db.execute(
        "DELETE FROM vehicles WHERE id = ?",
        [req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      res.json({ message: "Vehicle deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
