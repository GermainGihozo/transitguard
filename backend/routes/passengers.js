const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { validate } = require('../middleware/validator');

// Get all passengers with pagination and search
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const period = req.query.period || '';
    
    let whereClause = '';
    let params = [];
    
    // Search filter
    if (search) {
      whereClause = `WHERE p.full_name LIKE ? OR p.national_id LIKE ? OR p.phone LIKE ?`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Period filter
    if (period) {
      const periodClause = whereClause ? ' AND ' : ' WHERE ';
      switch(period) {
        case 'today':
          whereClause += `${periodClause}DATE(p.created_at) = CURDATE()`;
          break;
        case 'week':
          whereClause += `${periodClause}p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
          break;
        case 'month':
          whereClause += `${periodClause}p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
          break;
      }
    }
    
    // Get total count
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM passengers p ${whereClause}`,
      params
    );
    const total = countResult[0].total;
    
    // Get passengers with ticket count and last boarding
    const [passengers] = await db.execute(
      `SELECT 
        p.*,
        COUNT(DISTINCT t.id) as ticket_count,
        MAX(bh.scan_time) as last_boarding
      FROM passengers p
      LEFT JOIN tickets t ON p.id = t.passenger_id
      LEFT JOIN boarding_history bh ON p.id = bh.passenger_id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
    // Get stats
    const [statsResult] = await db.execute(`
      SELECT 
        COUNT(DISTINCT p.id) as total,
        COUNT(DISTINCT CASE WHEN t.is_used = 0 THEN t.id END) as active_tickets,
        COUNT(DISTINCT CASE WHEN DATE(bh.scan_time) = CURDATE() THEN bh.id END) as today_boardings,
        COUNT(DISTINCT CASE WHEN p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN p.id END) as new_this_week
      FROM passengers p
      LEFT JOIN tickets t ON p.id = t.passenger_id
      LEFT JOIN boarding_history bh ON p.id = bh.passenger_id
    `);
    
    res.json({
      passengers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: statsResult[0]
    });
    
  } catch (error) {
    console.error('Error fetching passengers:', error);
    res.status(500).json({ 
      message: 'Failed to fetch passengers',
      errors: [error.message]
    });
  }
});

// Get single passenger with details
router.get('/:id', async (req, res) => {
  try {
    const passengerId = req.params.id;
    
    // Get passenger info
    const [passengers] = await db.execute(
      'SELECT * FROM passengers WHERE id = ?',
      [passengerId]
    );
    
    if (passengers.length === 0) {
      return res.status(404).json({ message: 'Passenger not found' });
    }
    
    const passenger = passengers[0];
    
    // Get ticket statistics
    const [ticketStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_tickets,
        SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as active_tickets
      FROM tickets
      WHERE passenger_id = ?
    `, [passengerId]);
    
    // Get boarding statistics
    const [boardingStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_boardings,
        MAX(scan_time) as last_boarding
      FROM boarding_history
      WHERE passenger_id = ?
    `, [passengerId]);
    
    // Get recent tickets
    const [tickets] = await db.execute(`
      SELECT 
        t.*,
        CONCAT(v.plate_number, ' - ', r.route_name) as trip_info
      FROM tickets t
      LEFT JOIN trips tr ON t.trip_id = tr.id
      LEFT JOIN vehicles v ON tr.vehicle_id = v.id
      LEFT JOIN routes r ON tr.route_id = r.id
      WHERE t.passenger_id = ?
      ORDER BY t.created_at DESC
      LIMIT 10
    `, [passengerId]);
    
    res.json({
      ...passenger,
      ...ticketStats[0],
      ...boardingStats[0],
      tickets
    });
    
  } catch (error) {
    console.error('Error fetching passenger details:', error);
    res.status(500).json({ 
      message: 'Failed to fetch passenger details',
      errors: [error.message]
    });
  }
});

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

        res.json({
            message: "✓ Passenger registered successfully!",
            passenger_id
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ 
          message: "Registration failed",
          errors: ["An error occurred while processing your request. Please try again."]
        });
    }
});

// Delete passenger
router.delete('/:id', async (req, res) => {
  try {
    const passengerId = req.params.id;
    
    // Check if passenger exists
    const [passengers] = await db.execute(
      'SELECT id FROM passengers WHERE id = ?',
      [passengerId]
    );
    
    if (passengers.length === 0) {
      return res.status(404).json({ message: 'Passenger not found' });
    }
    
    // Delete passenger (cascade will handle tickets and boarding records)
    await db.execute('DELETE FROM passengers WHERE id = ?', [passengerId]);
    
    res.json({ message: 'Passenger deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting passenger:', error);
    res.status(500).json({ 
      message: 'Failed to delete passenger',
      errors: [error.message]
    });
  }
});

module.exports = router;