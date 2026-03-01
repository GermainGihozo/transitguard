const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { validate } = require('../middleware/validator');

// Register passenger + assign ticket
router.post('/register', 
  validate({
    full_name: { required: true, minLength: 2, maxLength: 100 },
    fingerprint: { required: true, minLength: 10 },
    national_id: { type: "nationalId" },
    phone: { type: "phone" }
  }),
  async (req, res) => {
    try {
        const { full_name, national_id, passport_number, phone, fingerprint } = req.body;

        // Check for duplicate national_id if provided
        if (national_id) {
          const [existing] = await db.execute(
            "SELECT id FROM passengers WHERE national_id = ?",
            [national_id]
          );
          if (existing.length > 0) {
            return res.status(409).json({ 
              message: "National ID already registered",
              errors: ["This National ID is already in the system"]
            });
          }
        }

        // Insert passenger
        const [result] = await db.execute(
            `INSERT INTO passengers 
            (full_name, national_id, passport_number, phone, fingerprint_template)
            VALUES (?, ?, ?, ?, ?)`,
            [full_name, national_id || null, passport_number || null, phone || null, fingerprint]
        );

        const passenger_id = result.insertId;

        // Assign ticket automatically
        const trip_id = 1;
        const seat_number = "A" + Math.floor(Math.random() * 30 + 1);

        await db.execute(
            `INSERT INTO tickets (passenger_id, trip_id, seat_number)
             VALUES (?, ?, ?)`,
            [passenger_id, trip_id, seat_number]
        );

        res.json({
            message: "✓ Passenger registered and ticket assigned successfully!",
            passenger_id,
            seat_number
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ 
          message: "Registration failed",
          errors: ["An error occurred while processing your request. Please try again."]
        });
    }
});

module.exports = router;