// Script to update trip status to make them visible in active trips
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../config/db');

async function updateTripStatus() {
  try {
    console.log('Checking trips...');
    
    // Get all trips
    const [trips] = await db.execute('SELECT id, status, departure_time FROM trips');
    
    console.log(`Found ${trips.length} trips`);
    
    if (trips.length === 0) {
      console.log('No trips found. Please create trips first.');
      process.exit(0);
    }
    
    // Show current trips
    console.log('\nCurrent trips:');
    trips.forEach(trip => {
      console.log(`  Trip #${trip.id}: ${trip.status} - ${trip.departure_time}`);
    });
    
    // Update trips to 'departed' status so they show in active trips
    const [result] = await db.execute(
      `UPDATE trips SET status = 'departed' WHERE status NOT IN ('departed', 'scheduled')`
    );
    
    console.log(`\n✓ Updated ${result.affectedRows} trips to 'departed' status`);
    
    // Show updated trips
    const [updatedTrips] = await db.execute('SELECT id, status FROM trips');
    console.log('\nUpdated trips:');
    updatedTrips.forEach(trip => {
      console.log(`  Trip #${trip.id}: ${trip.status}`);
    });
    
    console.log('\n✓ Trip status update completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error updating trip status:', error);
    process.exit(1);
  }
}

updateTripStatus();
