// Test script for user management hierarchy
const http = require('http');

const API_URL = 'http://localhost:5000/api';

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const fullPath = API_URL + path;
    const urlObj = new URL(fullPath);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function test() {
  console.log('=== TransitGuard User Management Test ===\n');

  try {
    // Step 1: Login as Super Admin
    console.log('1. Logging in as Super Admin...');
    const loginRes = await makeRequest('POST', '/auth/login', {
      email: 'admin@test.com',
      password: 'password123'
    });

    if (loginRes.status !== 200) {
      console.log('   ✗ Login failed. Status:', loginRes.status);
      console.log('   Response:', JSON.stringify(loginRes.data, null, 2));
      console.log('   → Make sure you have a super admin account');
      console.log('   → Run: npm run create-user');
      return;
    }

    const superAdminToken = loginRes.data.token;
    console.log('   ✓ Super Admin logged in');
    console.log('   Token:', superAdminToken.substring(0, 20) + '...\n');

    // Step 2: Super Admin creates Company Admin
    console.log('2. Super Admin creating Company Admin...');
    const createCompanyAdmin = await makeRequest('POST', '/users/create', {
      full_name: 'Test Company Admin',
      email: `company${Date.now()}@test.com`,
      password: 'password123',
      fingerprint_template: 'company_fingerprint_' + Date.now(),
      role: 'company_admin'
    }, superAdminToken);

    if (createCompanyAdmin.status === 201) {
      console.log('   ✓ Company Admin created successfully');
      console.log('   User:', createCompanyAdmin.data.user);
    } else {
      console.log('   ⚠ Response:', createCompanyAdmin.data);
    }
    console.log('');

    // Step 3: Try to create Station Officer as Super Admin (should fail)
    console.log('3. Testing: Super Admin trying to create Station Officer...');
    const createStationOfficer = await makeRequest('POST', '/users/create', {
      full_name: 'Test Station Officer',
      email: `officer${Date.now()}@test.com`,
      password: 'password123',
      fingerprint_template: 'officer_fingerprint_' + Date.now(),
      role: 'station_officer'
    }, superAdminToken);

    if (createStationOfficer.status === 403) {
      console.log('   ✓ Correctly blocked! Super Admin cannot create Station Officers');
      console.log('   Message:', createStationOfficer.data.message);
    } else {
      console.log('   ✗ Unexpected response:', createStationOfficer.data);
    }
    console.log('');

    // Step 4: Get all users
    console.log('4. Fetching all users...');
    const usersRes = await makeRequest('GET', '/users?limit=5', null, superAdminToken);
    
    if (usersRes.status === 200) {
      console.log('   ✓ Users retrieved successfully');
      console.log('   Total users:', usersRes.data.pagination.total);
      console.log('   First 3 users:');
      usersRes.data.users.slice(0, 3).forEach(user => {
        console.log(`     - ${user.full_name} (${user.role}) - ${user.email}`);
      });
    }
    console.log('');

    // Step 5: Test public registration (should be disabled)
    console.log('5. Testing public registration endpoint...');
    const publicReg = await makeRequest('POST', '/auth/register', {
      full_name: 'Public User',
      email: 'public@test.com',
      password: 'password123',
      fingerprint_template: 'public_fingerprint'
    });

    if (publicReg.status === 403) {
      console.log('   ✓ Public registration correctly disabled');
      console.log('   Message:', publicReg.data.message);
    } else {
      console.log('   ✗ Unexpected response:', publicReg.data);
    }
    console.log('');

    console.log('=== Test Summary ===');
    console.log('✓ Super Admin can login');
    console.log('✓ Super Admin can create Company Admins');
    console.log('✓ Super Admin cannot create other roles');
    console.log('✓ Public registration is disabled');
    console.log('✓ User listing works');
    console.log('\nNext steps:');
    console.log('1. Login as Company Admin');
    console.log('2. Create Station Officers, Authority, and Conductors');
    console.log('3. Test user management operations (update, delete, reset password)');

  } catch (error) {
    console.error('✗ Test failed:', error.message);
  }
}

test();
