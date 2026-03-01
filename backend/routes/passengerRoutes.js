const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validator");
const { encrypt } = require("../utils/encryption");

/* REGISTER PASSENGER WITH BIOMETRIC */
router.post(
  "/register",
  authMiddleware,
  roleMiddleware("station_officer", "company_admin", "super_admin"),
  validate({
    full_name: { required: true, minLength: 2, maxLength: 100 },
    fingerprint_template: { required: true, minLength: 10 },
    national_id: { type: "nationalId" },
    phone: { type: "phone" }
  }),
  async (req, res, next) => {
    const { full_name, national_id, passport_number, phone, fingerprint_template } = req.body;

    try {
      // Check for duplicate national_id or passport
      if (national_id) {
        const [existing] = await db.execute(
          "SELECT id FROM passengers WHERE national_id = ?",
          [national_id]
        );
        if (existing.length > 0) {
          return res.status(409).json({ message: "National ID already registered" });
        }
      }

      const encryptedFingerprint = encrypt(fingerprint_template);

      const sql = `
        INSERT INTO passengers
        (full_name, national_id, passport_number, phone, fingerprint_template)
        VALUES (?, ?, ?, ?, ?)
      `;

      const [result] = await db.execute(sql, [
        full_name,
        national_id || null,
        passport_number || null,
        phone || null,
        encryptedFingerprint
      ]);

      res.status(201).json({
        message: "Passenger registered successfully",
        passenger_id: result.insertId
      });
    } catch (error) {
      next(error);
    }
  }
);

/* GET ALL PASSENGERS (with pagination) */
router.get(
  "/",
  authMiddleware,
  roleMiddleware("station_officer", "company_admin", "super_admin", "authority"),
  async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    try {
      const [passengers] = await db.execute(
        `SELECT id, full_name, national_id, passport_number, phone, created_at 
         FROM passengers 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      const [[{ total }]] = await db.execute(
        "SELECT COUNT(*) as total FROM passengers"
      );

      res.json({
        passengers,
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

/* GET PASSENGER BY ID */
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("station_officer", "company_admin", "super_admin", "authority"),
  async (req, res, next) => {
    try {
      const [passengers] = await db.execute(
        "SELECT id, full_name, national_id, passport_number, phone, created_at FROM passengers WHERE id = ?",
        [req.params.id]
      );

      if (passengers.length === 0) {
        return res.status(404).json({ message: "Passenger not found" });
      }

      res.json(passengers[0]);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
