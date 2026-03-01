const fs = require('fs');
const path = require('path');
const db = require('../config/db');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function seedStations() {
  try {
    console.log('Seeding stations...');
    
    // Check if table exists
    const [tables] = await db.execute("SHOW TABLES LIKE 'stations'");
    if (tables.length === 0) {
      console.error('✗ Stations table does not exist. Run migration first.');
      process.exit(1);
    }
    
    // Direct INSERT
    const stations = [
      ['Byumba Station', 'Main Street, Byumba Town', 'Byumba', 'Northern Province', -1.5760, 30.0670],
      ['Gatuna Border Station', 'Gatuna Border Post', 'Gatuna', 'Northern Province', -1.2833, 30.0833],
      ['Kagitumba Border Station', 'Kagitumba Border Crossing', 'Kagitumba', 'Eastern Province', -1.3167, 30.7833],
      ['Kigali Central Station', 'KN 3 Ave, Nyarugenge', 'Kigali', 'Kigali City', -1.9536, 30.0606],
      ['Nyabugogo Station', 'Nyabugogo Bus Terminal', 'Kigali', 'Kigali City', -1.9403, 30.0588],
      ['Musanze Station', 'Musanze Town Center', 'Musanze', 'Northern Province', -1.4989, 29.6344],
      ['Rubavu Station', 'Rubavu Town, Gisenyi', 'Rubavu', 'Western Province', -1.6778, 29.2667],
      ['Rusizi Station', 'Rusizi District, Kamembe', 'Rusizi', 'Western Province', -2.4833, 28.9000],
      ['Huye Station', 'Huye Town, Butare', 'Huye', 'Southern Province', -2.5967, 29.7389],
      ['Muhanga Station', 'Muhanga Town Center', 'Muhanga', 'Southern Province', -2.0833, 29.7500],
      ['Rwamagana Station', 'Rwamagana Town', 'Rwamagana', 'Eastern Province', -1.9500, 30.4333],
      ['Kayonza Station', 'Kayonza District Center', 'Kayonza', 'Eastern Province', -1.8833, 30.4167]
    ];
    
    for (const station of stations) {
      await db.execute(
        'INSERT INTO stations (name, location, city, region, latitude, longitude, is_active) VALUES (?, ?, ?, ?, ?, ?, TRUE)',
        station
      );
    }
    
    console.log('✓ Stations seeded successfully!');
    
    // Show seeded stations
    const [result] = await db.execute('SELECT name, city, region FROM stations ORDER BY name');
    console.log(`\nTotal stations: ${result.length}`);
    console.log('\nSeeded Stations:');
    result.forEach(s => {
      console.log(`  - ${s.name} (${s.city}, ${s.region})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding stations:', error.message);
    process.exit(1);
  }
}

seedStations();
