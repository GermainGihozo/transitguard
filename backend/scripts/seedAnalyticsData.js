// Script to seed sample analytics data for testing
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../config/db');

async function seedAnalyticsData() {
  try {
    console.log('Starting analytics data seeding...');
    
    // Check if we have passengers
    const [passengers] = await db.execute('SELECT id FROM passengers LIMIT 10');
    if (passengers.length === 0) {
      console.log('No passengers found. Creating sample passengers...');
      
      for (let i = 1; i <= 10; i++) {
        await db.execute(
          `INSERT INTO passengers (full_name, national_id, phone, fingerprint_template) 
           VALUES (?, ?, ?, ?)`,
          [
            `Test Passenger ${i}`,
            `1234567890${String(i).padStart(6, '0')}`,
            `+25078812345${i}`,
            `fp_test_${i}_${Math.random().toString(36).substring(7)}`
          ]
        );
      }
      console.log('✓ Created 10 sample passengers');
    }
    
    // Get passenger IDs
    const [allPassengers] = await db.execute('SELECT id FROM passengers');
    const passengerIds = allPassengers.map(p => p.id);
    
    // Check if we have trips
    const [trips] = await db.execute('SELECT id FROM trips LIMIT 5');
    if (trips.length === 0) {
      console.log('No trips found. Please create vehicles, routes, and trips first.');
      console.log('You can use the dashboard to create these, or run other seed scripts.');
      return;
    }
    
    // Get trip IDs
    const [allTrips] = await db.execute('SELECT id FROM trips');
    const tripIds = allTrips.map(t => t.id);
    
    console.log(`Found ${passengerIds.length} passengers and ${tripIds.length} trips`);
    
    // Generate boarding history for the last 30 days
    console.log('Generating boarding history...');
    
    const now = new Date();
    let recordsCreated = 0;
    
    for (let day = 0; day < 30; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);
      
      // Generate 5-20 boarding records per day
      const recordsPerDay = Math.floor(Math.random() * 16) + 5;
      
      for (let i = 0; i < recordsPerDay; i++) {
        const passengerId = passengerIds[Math.floor(Math.random() * passengerIds.length)];
        const tripId = tripIds[Math.floor(Math.random() * tripIds.length)];
        
        // Random hour between 6 AM and 10 PM
        const hour = Math.floor(Math.random() * 16) + 6;
        const minute = Math.floor(Math.random() * 60);
        
        date.setHours(hour, minute, 0, 0);
        
        // 90% approval rate
        const status = Math.random() < 0.9 ? 'approved' : 'denied';
        
        try {
          await db.execute(
            `INSERT INTO boarding_history (passenger_id, trip_id, scan_time, status)
             VALUES (?, ?, ?, ?)`,
            [passengerId, tripId, date.toISOString().slice(0, 19).replace('T', ' '), status]
          );
          recordsCreated++;
        } catch (err) {
          // Skip duplicates
          if (!err.message.includes('Duplicate')) {
            console.error('Error inserting record:', err.message);
          }
        }
      }
    }
    
    console.log(`✓ Created ${recordsCreated} boarding history records`);
    
    // Show summary
    const [summary] = await db.execute(`
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END) as denied,
        COUNT(DISTINCT passenger_id) as unique_passengers,
        COUNT(DISTINCT trip_id) as unique_trips,
        MIN(scan_time) as earliest,
        MAX(scan_time) as latest
      FROM boarding_history
    `);
    
    console.log('\n=== Analytics Data Summary ===');
    console.log(`Total Records: ${summary[0].total_records}`);
    console.log(`Approved: ${summary[0].approved}`);
    console.log(`Denied: ${summary[0].denied}`);
    console.log(`Unique Passengers: ${summary[0].unique_passengers}`);
    console.log(`Unique Trips: ${summary[0].unique_trips}`);
    console.log(`Date Range: ${summary[0].earliest} to ${summary[0].latest}`);
    console.log('\n✓ Analytics data seeding completed!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error seeding analytics data:', error);
    process.exit(1);
  }
}

seedAnalyticsData();
