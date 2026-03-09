const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get analytics data
router.get('/', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get metrics for current period
    const [currentMetrics] = await db.execute(`
      SELECT 
        COUNT(DISTINCT p.id) as totalPassengers,
        COUNT(DISTINCT bh.id) as totalBoardings,
        COUNT(DISTINCT t.id) as totalTrips,
        ROUND(AVG(CASE WHEN bh.status = 'approved' THEN 100 ELSE 0 END), 1) as approvalRate
      FROM passengers p
      LEFT JOIN boarding_history bh ON p.id = bh.passenger_id AND bh.scan_time >= ?
      LEFT JOIN trips t ON t.departure_time >= ?
    `, [startDate, startDate]);
    
    // Get metrics for previous period (for comparison)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);
    
    const [previousMetrics] = await db.execute(`
      SELECT 
        COUNT(DISTINCT p.id) as totalPassengers,
        COUNT(DISTINCT bh.id) as totalBoardings,
        COUNT(DISTINCT t.id) as totalTrips
      FROM passengers p
      LEFT JOIN boarding_history bh ON p.id = bh.passenger_id 
        AND bh.scan_time >= ? AND bh.scan_time < ?
      LEFT JOIN trips t ON t.departure_time >= ? AND t.departure_time < ?
    `, [previousStartDate, startDate, previousStartDate, startDate]);
    
    // Calculate percentage changes
    const metrics = {
      ...currentMetrics[0],
      passengersChange: calculateChange(currentMetrics[0].totalPassengers, previousMetrics[0].totalPassengers),
      boardingsChange: calculateChange(currentMetrics[0].totalBoardings, previousMetrics[0].totalBoardings),
      tripsChange: calculateChange(currentMetrics[0].totalTrips, previousMetrics[0].totalTrips)
    };
    
    // Get daily trends
    const [trends] = await db.execute(`
      SELECT 
        DATE(scan_time) as date,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END) as denied
      FROM boarding_history
      WHERE scan_time >= ?
      GROUP BY DATE(scan_time)
      ORDER BY date ASC
    `, [startDate]);
    
    // Get boarding status totals
    const [status] = await db.execute(`
      SELECT 
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END) as denied
      FROM boarding_history
      WHERE scan_time >= ?
    `, [startDate]);
    
    // Get top companies
    const [companies] = await db.execute(`
      SELECT 
        v.company_name,
        COUNT(DISTINCT t.id) as trip_count
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.departure_time >= ?
      GROUP BY v.company_name
      ORDER BY trip_count DESC
      LIMIT 10
    `, [startDate]);
    
    // Get top routes
    const [routes] = await db.execute(`
      SELECT 
        r.route_name,
        COUNT(bh.id) as boarding_count
      FROM boarding_history bh
      JOIN trips t ON bh.trip_id = t.id
      JOIN routes r ON t.route_id = r.id
      WHERE bh.scan_time >= ?
      GROUP BY r.route_name
      ORDER BY boarding_count DESC
      LIMIT 10
    `, [startDate]);
    
    // Get peak hours (0-23)
    const [peakHoursData] = await db.execute(`
      SELECT 
        HOUR(scan_time) as hour,
        COUNT(*) as count
      FROM boarding_history
      WHERE scan_time >= ?
      GROUP BY HOUR(scan_time)
      ORDER BY hour
    `, [startDate]);
    
    // Fill in missing hours with 0
    const peakHours = Array(24).fill(0);
    peakHoursData.forEach(row => {
      peakHours[row.hour] = row.count;
    });
    
    // Get daily reports
    const [dailyReports] = await db.execute(`
      SELECT 
        DATE(scan_time) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END) as denied,
        COUNT(DISTINCT passenger_id) as unique_passengers
      FROM boarding_history
      WHERE scan_time >= ?
      GROUP BY DATE(scan_time)
      ORDER BY date DESC
      LIMIT 30
    `, [startDate]);
    
    res.json({
      metrics,
      trends,
      status: status[0],
      companies,
      routes,
      peakHours,
      dailyReports
    });
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ 
      message: 'Failed to fetch analytics',
      errors: [error.message]
    });
  }
});

function calculateChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

module.exports = router;
