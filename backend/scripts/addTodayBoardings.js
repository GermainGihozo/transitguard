// Script to add boarding records for today
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../config/db');

async function addTodayBoardings() {
  try {
    console.log('Adding today\'s boarding records...');
    
    // Get passengers and trips
    const [passengers] = await db.execute('SELECT id FROM passengers LIMIT 10');
    const [trips] = await db.execute('SELECT id FROM trips LIMIT 1');
    
    if (passengers.length === 0 || trips.length === 0) {
      console.log('Need passengers and trips first!');
      process.exit(1);
    }
    
    const tripId = trips[0].id;
    let recordsCreated = 0;
    
    // Create 10 boarding records for today
    for (let i = 0; i < 10; i++) {
      const passengerId = passengers[i % passengers.length].id;
      const status = Math.random() < 0.9 ? 'approved' : 'denied';
      
      // Random time today
      const now = new Date();
      now.setHours(Math.floor(Math.random() * 12) + 6); // 6 AM to 6 PM
      now.setMinutes(Math.floor(Math.random() * 60));
      
      try {
        // Create ticket first
        const [ticketResult] = await db.execute(
          `INSERT INTO tickets (passenger_id, trip_id, is_used) VALUES (?, ?, ?)`,
          [passengerId, tripId, status === 'approved' ? 1 : 0]
        );
        
        // Create boarding history
        await db.execute(
          `INSERT INTO boarding_history (passenger_id, ticket_id, trip_id, scan_time, status)
           VALUES (?, ?, ?, ?, ?)`,
          [passengerId, ticketResult.insertId, tripId, now.toISOString().slice(0, 19).replace('T', ' '), status]
        );
        
        recordsCreated++;
      } catch (err) {
        console.error('Error creating record:', err.message);
      }
    }
    
    console.log(`✓ Created ${recordsCreated} boarding records for today`);
    
    // Show summary
    const [summary] = await db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END) as denied
      FROM boarding_history
      WHERE DATE(scan_time) = CURDATE()
    `);
    
    console.log('\nToday\'s Summary:');
    console.log(`  Total: ${summary[0].total}`);
    console.log(`  Approved: ${summary[0].approved}`);
    console.log(`  Denied: ${summary[0].denied}`);
    
    console.log('\n✓ Done!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addTodayBoardings();
