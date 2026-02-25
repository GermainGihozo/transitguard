const express = require('express');
const router = express.Router();
const db = require('../db'); // your mysql connection

// Register passenger + assign ticket
router.post('/register', async (req, res) => {
    try {
        const { full_name, national_id, passport_number, phone, fingerprint } = req.body;

        // Insert passenger
        const [result] = await db.execute(
            `INSERT INTO passengers 
            (full_name, national_id, passport_number, phone, fingerprint_template)
            VALUES (?, ?, ?, ?, ?)`,
            [full_name, national_id, passport_number, phone, fingerprint]
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
            message: "Passenger registered and ticket assigned",
            passenger_id
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Registration failed" });
    }
});

module.exports = router;