const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post("/scan", 
  authMiddleware, 
  roleMiddleware("station_officer", "company_admin", "super_admin"), 
  async (req, res, next) => {

  try {

    const { fingerprint_template } = req.body;

    // 1️⃣ Find passenger
    const [passengers] = await db.execute(
      "SELECT * FROM passengers WHERE fingerprint_template = ?",
      [fingerprint_template]
    );

    if (passengers.length === 0) {
      return res.status(404).json({ message: "Passenger not found" });
    }

    const passenger = passengers[0];

    // 2️⃣ Find unused ticket
    const [tickets] = await db.execute(
      "SELECT * FROM tickets WHERE passenger_id = ? AND is_used = 0 LIMIT 1",
      [passenger.id]
    );

    if (tickets.length === 0) {
      return res.status(400).json({ message: "No valid ticket" });
    }

    const ticket = tickets[0];

    // 3️⃣ Get trip
    const [trips] = await db.execute(
      "SELECT * FROM trips WHERE id = ?",
      [ticket.trip_id]
    );

    if (trips.length === 0) {
      return res.status(400).json({ message: "Trip not found" });
    }

    const trip = trips[0];

    // 4️⃣ Check trip status
    if (!["scheduled", "departed"].includes(trip.status)) {
      return res.status(400).json({ message: "Trip not active for boarding" });
    }

    // 5️⃣ Get vehicle
    const [vehicles] = await db.execute(
      "SELECT * FROM vehicles WHERE id = ?",
      [trip.vehicle_id]
    );

    const vehicle = vehicles[0];

    // 6️⃣ Count current onboard passengers
    const [countResult] = await db.execute(`
      SELECT COUNT(*) as onboard
      FROM boarding_history
      WHERE trip_id = ?
      AND status = 'approved'
    `, [trip.id]);

    const onboard = countResult[0].onboard;

    // 7️⃣ Capacity check
    if (onboard >= vehicle.capacity) {
      return res.status(400).json({ message: "Vehicle full" });
    }

    // 8️⃣ Mark ticket used
    await db.execute(
      "UPDATE tickets SET is_used = 1 WHERE id = ?",
      [ticket.id]
    );

    // 9️⃣ Log boarding
    await db.execute(`
      INSERT INTO boarding_history 
      (passenger_id, ticket_id, trip_id, status)
      VALUES (?, ?, ?, 'approved')
    `, [passenger.id, ticket.id, trip.id]);

    res.json({
      status: "approved",
      passenger_name: passenger.full_name,
      trip_id: trip.id,
      vehicle_plate: vehicle.plate_number,
      onboard_after_scan: onboard + 1
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;