const express = require("express");
const db = require("../config/db");
const jwtMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/* PASSENGER BIOMETRIC BOARDING */
router.post("/scan", jwtMiddleware, (req, res) => {
  const { fingerprint_template } = req.body;

  if (!fingerprint_template) {
    return res.status(400).json({ message: "Fingerprint required" });
  }

  // 1️⃣ Find passenger
  const findPassenger = "SELECT * FROM passengers WHERE fingerprint_template = ?";

  db.query(findPassenger, [fingerprint_template], (err, passengerResults) => {
    if (err) return res.status(500).json(err);

    if (passengerResults.length === 0) {
      return res.status(404).json({ message: "Passenger not found" });
    }

    const passenger = passengerResults[0];

    // 2️⃣ Check valid unused ticket
    const checkTicket = `
      SELECT * FROM tickets 
      WHERE passenger_id = ? AND is_used = FALSE
      LIMIT 1
    `;

    db.query(checkTicket, [passenger.id], (err, ticketResults) => {
      if (err) return res.status(500).json(err);

      if (ticketResults.length === 0) {
        return res.status(403).json({ message: "No valid ticket" });
      }

      const ticket = ticketResults[0];

      // 3️⃣ Mark ticket as used
      db.query(
        "UPDATE tickets SET is_used = TRUE WHERE id = ?",
        [ticket.id]
      );

      // 4️⃣ Log boarding
      db.query(
        "INSERT INTO boarding_logs (passenger_id, conductor_id, station_id) VALUES (?, ?, ?)",
        [passenger.id, req.user.id, req.user.station_id || null]
      );

      res.json({
        message: "Boarding successful",
        passenger: {
          id: passenger.id,
          full_name: passenger.full_name
        }
      });
    });
  });
});

module.exports = router;
