const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validator");

/* CREATE/ASSIGN TICKET */
router.post(
  "/",
  authMiddleware,
  roleMiddleware("station_officer", "company_admin", "super_admin"),
  validate({
    passenger_id: { required: true },
    trip_id: { required: true }
  }),
  async (req, res, next) => {
    const { passenger_id, trip_id } = req.body;

    try {
      // Verify passenger exists
      const [passenger] = await db.execute(
        "SELECT id FROM passengers WHERE id = ?",
        [passenger_id]
      );

      if (passenger.length === 0) {
        return res.status(404).json({ message: "Passenger not found" });
      }

      // Verify trip exists and is not departed/arrived/cancelled
      const [trip] = await db.execute(
        "SELECT id, status FROM trips WHERE id = ?",
        [trip_id]
      );

      if (trip.length === 0) {
        return res.status(404).json({ message: "Trip not found" });
      }

      if (trip[0].status !== "scheduled") {
        return res.status(400).json({
          message: "Cannot assign ticket to trip with status: " + trip[0].status
        });
      }

      // Check if passenger already has a ticket for this trip
      const [existing] = await db.execute(
        "SELECT id FROM tickets WHERE passenger_id = ? AND trip_id = ?",
        [passenger_id, trip_id]
      );

      if (existing.length > 0) {
        return res.status(409).json({
          message: "Passenger already has a ticket for this trip"
        });
      }

      const [result] = await db.execute(
        "INSERT INTO tickets (passenger_id, trip_id, is_used) VALUES (?, ?, FALSE)",
        [passenger_id, trip_id]
      );

      res.status(201).json({
        message: "Ticket assigned successfully",
        ticket_id: result.insertId
      });
    } catch (error) {
      next(error);
    }
  }
);

/* GET ALL TICKETS */
router.get(
  "/",
  authMiddleware,
  roleMiddleware("station_officer", "company_admin", "super_admin", "authority"),
  async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const is_used = req.query.is_used; // Filter by used status

    try {
      let query = `
        SELECT 
          t.id,
          t.is_used,
          t.created_at,
          p.full_name as passenger_name,
          p.national_id,
          tr.id as trip_id,
          tr.departure_time,
          v.plate_number
        FROM tickets t
        JOIN passengers p ON t.passenger_id = p.id
        JOIN trips tr ON t.trip_id = tr.id
        JOIN vehicles v ON tr.vehicle_id = v.id
      `;

      const params = [];

      if (is_used !== undefined) {
        query += " WHERE t.is_used = ?";
        params.push(is_used === "true" ? 1 : 0);
      }

      query += " ORDER BY t.created_at DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const [tickets] = await db.execute(query, params);

      const countQuery = is_used !== undefined
        ? "SELECT COUNT(*) as total FROM tickets WHERE is_used = ?"
        : "SELECT COUNT(*) as total FROM tickets";
      const countParams = is_used !== undefined ? [is_used === "true" ? 1 : 0] : [];

      const [[{ total }]] = await db.execute(countQuery, countParams);

      res.json({
        tickets,
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

/* GET TICKET BY ID */
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("station_officer", "company_admin", "super_admin", "authority", "conductor"),
  async (req, res, next) => {
    try {
      const [tickets] = await db.execute(
        `SELECT 
          t.*,
          p.full_name as passenger_name,
          p.national_id,
          tr.departure_time,
          tr.status as trip_status,
          v.plate_number
         FROM tickets t
         JOIN passengers p ON t.passenger_id = p.id
         JOIN trips tr ON t.trip_id = tr.id
         JOIN vehicles v ON tr.vehicle_id = v.id
         WHERE t.id = ?`,
        [req.params.id]
      );

      if (tickets.length === 0) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      res.json(tickets[0]);
    } catch (error) {
      next(error);
    }
  }
);

/* GET TICKETS BY PASSENGER ID */
router.get(
  "/passenger/:passenger_id",
  authMiddleware,
  roleMiddleware("station_officer", "company_admin", "super_admin", "authority"),
  async (req, res, next) => {
    try {
      const [tickets] = await db.execute(
        `SELECT 
          t.*,
          tr.departure_time,
          tr.status as trip_status,
          v.plate_number
         FROM tickets t
         JOIN trips tr ON t.trip_id = tr.id
         JOIN vehicles v ON tr.vehicle_id = v.id
         WHERE t.passenger_id = ?
         ORDER BY t.created_at DESC`,
        [req.params.passenger_id]
      );

      res.json(tickets);
    } catch (error) {
      next(error);
    }
  }
);

/* CANCEL TICKET */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("station_officer", "company_admin", "super_admin"),
  async (req, res, next) => {
    try {
      // Check if ticket is already used
      const [ticket] = await db.execute(
        "SELECT is_used FROM tickets WHERE id = ?",
        [req.params.id]
      );

      if (ticket.length === 0) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      if (ticket[0].is_used) {
        return res.status(400).json({ message: "Cannot cancel used ticket" });
      }

      const [result] = await db.execute(
        "DELETE FROM tickets WHERE id = ?",
        [req.params.id]
      );

      res.json({ message: "Ticket cancelled successfully" });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
