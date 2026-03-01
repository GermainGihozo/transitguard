const express = require("express");
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validator");
const { scanLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

/* PASSENGER BIOMETRIC BOARDING SCAN */
router.post(
  "/scan",
  authMiddleware,
  scanLimiter,
  roleMiddleware("conductor", "station_officer", "super_admin"),
  validate({
    fingerprint_template: { required: true, minLength: 10 },
    trip_id: { required: true }
  }),
  async (req, res, next) => {
    const { fingerprint_template, trip_id } = req.body;

    try {
      // 1️⃣ Find passenger by fingerprint
      const [passengerResults] = await db.execute(
        "SELECT * FROM passengers WHERE fingerprint_template = ?",
        [fingerprint_template]
      );

      if (passengerResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Passenger not found. Please register first."
        });
      }

      const passenger = passengerResults[0];

      // 2️⃣ Get trip details with route and vehicle info
      const [tripResults] = await db.execute(
        `SELECT t.*, 
                v.plate_number, v.capacity, v.company_name,
                r.route_name,
                os.name as origin_station,
                ds.name as destination_station
         FROM trips t
         JOIN vehicles v ON t.vehicle_id = v.id
         JOIN routes r ON t.route_id = r.id
         JOIN stations os ON r.origin_station_id = os.id
         JOIN stations ds ON r.destination_station_id = ds.id
         WHERE t.id = ?`,
        [trip_id]
      );

      if (tripResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Trip not found"
        });
      }

      const trip = tripResults[0];

      // 3️⃣ Check trip status
      if (!["scheduled", "departed"].includes(trip.status)) {
        return res.status(400).json({
          success: false,
          message: `Trip is ${trip.status}. Boarding not allowed.`
        });
      }

      // 4️⃣ Check if passenger already has a ticket for this trip
      const [existingTicket] = await db.execute(
        "SELECT id, is_used FROM tickets WHERE passenger_id = ? AND trip_id = ?",
        [passenger.id, trip_id]
      );

      let ticket;
      let isNewTicket = false;

      if (existingTicket.length > 0) {
        // Passenger already has a ticket for this trip
        ticket = existingTicket[0];
        
        if (ticket.is_used) {
          return res.status(400).json({
            success: false,
            message: "Passenger has already boarded this trip"
          });
        }
      } else {
        // 5️⃣ Check vehicle capacity before creating ticket
        const [capacityCheck] = await db.execute(
          `SELECT COUNT(*) as boarded FROM tickets 
           WHERE trip_id = ? AND is_used = TRUE`,
          [trip_id]
        );

        if (capacityCheck[0].boarded >= trip.capacity) {
          return res.status(400).json({
            success: false,
            message: "Vehicle is at full capacity"
          });
        }

        // 6️⃣ Auto-create ticket for passenger
        const [ticketResult] = await db.execute(
          "INSERT INTO tickets (passenger_id, trip_id, is_used) VALUES (?, ?, FALSE)",
          [passenger.id, trip_id]
        );

        ticket = {
          id: ticketResult.insertId,
          is_used: false
        };
        isNewTicket = true;
      }

      // 7️⃣ Mark ticket as used
      await db.execute(
        "UPDATE tickets SET is_used = TRUE WHERE id = ?",
        [ticket.id]
      );

      // 8️⃣ Log boarding event
      await db.execute(
        `INSERT INTO boarding_logs 
         (passenger_id, trip_id, station_id, verification_status) 
         VALUES (?, ?, ?, ?)`,
        [passenger.id, trip_id, req.user.station_id || null, "verified"]
      );

      // 9️⃣ Also log in boarding_history for dashboard compatibility
      await db.execute(
        `INSERT INTO boarding_history 
         (passenger_id, ticket_id, trip_id, status) 
         VALUES (?, ?, ?, ?)`,
        [passenger.id, ticket.id, trip_id, "approved"]
      );

      // 🔟 Get updated passenger count
      const [updatedCount] = await db.execute(
        `SELECT COUNT(*) as boarded FROM tickets 
         WHERE trip_id = ? AND is_used = TRUE`,
        [trip_id]
      );

      res.json({
        success: true,
        message: isNewTicket 
          ? "✓ Ticket created and boarding approved!" 
          : "✓ Boarding approved!",
        ticket_created: isNewTicket,
        passenger: {
          id: passenger.id,
          full_name: passenger.full_name,
          national_id: passenger.national_id,
          phone: passenger.phone
        },
        ticket: {
          id: ticket.id,
          trip_id: trip_id
        },
        trip: {
          id: trip.id,
          plate_number: trip.plate_number,
          company_name: trip.company_name,
          route: trip.route_name,
          origin: trip.origin_station,
          destination: trip.destination_station,
          departure_time: trip.departure_time,
          passengers_boarded: updatedCount[0].boarded,
          capacity: trip.capacity,
          occupancy_percent: Math.round((updatedCount[0].boarded / trip.capacity) * 100)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/* GET BOARDING HISTORY */
router.get(
  "/history",
  authMiddleware,
  roleMiddleware("conductor", "station_officer", "company_admin", "super_admin", "authority"),
  async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    try {
      const [logs] = await db.execute(
        `SELECT 
          bl.id,
          bl.boarding_time,
          bl.verification_status,
          p.full_name as passenger_name,
          t.id as trip_id,
          v.plate_number
         FROM boarding_logs bl
         JOIN passengers p ON bl.passenger_id = p.id
         LEFT JOIN trips t ON bl.trip_id = t.id
         LEFT JOIN vehicles v ON t.vehicle_id = v.id
         ORDER BY bl.boarding_time DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      const [[{ total }]] = await db.execute(
        "SELECT COUNT(*) as total FROM boarding_logs"
      );

      res.json({
        logs,
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

module.exports = router;
