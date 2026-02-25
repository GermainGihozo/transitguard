const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/scan', async (req, res) => {
    try {
        const { fingerprint } = req.body;

        // 1️⃣ Find passenger
        const [passengers] = await db.execute(
            "SELECT * FROM passengers WHERE fingerprint_template = ?",
            [fingerprint]
        );

        if (passengers.length === 0) {
            return res.json({ status: "denied", reason: "Passenger not found" });
        }

        const passenger = passengers[0];

        // 2️⃣ Find valid ticket
        const [tickets] = await db.execute(
            "SELECT * FROM tickets WHERE passenger_id = ? AND is_used = 0 LIMIT 1",
            [passenger.id]
        );

        if (tickets.length === 0) {
            await db.execute(
                "INSERT INTO boarding_history (passenger_id, ticket_id, trip_id, status) VALUES (?, ?, ?, ?)",
                [passenger.id, 0, 0, 'denied']
            );

            return res.json({ status: "denied", reason: "No valid ticket" });
        }

        const ticket = tickets[0];

        // 3️⃣ Mark ticket used
        await db.execute(
            "UPDATE tickets SET is_used = 1 WHERE id = ?",
            [ticket.id]
        );

        // 4️⃣ Insert boarding history
        await db.execute(
            "INSERT INTO boarding_history (passenger_id, ticket_id, trip_id, status) VALUES (?, ?, ?, ?)",
            [passenger.id, ticket.id, ticket.trip_id, 'approved']
        );

        res.json({
            status: "approved",
            passenger: passenger.full_name,
            seat: ticket.seat_number
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Scan failed" });
    }
});

module.exports = router;