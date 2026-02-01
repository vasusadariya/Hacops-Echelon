/**
 * Backend Health Check Script
 * Tests if the FastAPI backend is running and accessible
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

async function checkBackendHealth() {
  console.log('🔍 Checking backend health...');
  console.log('Backend URL:', BACKEND_URL);
  console.log('');

  try {
    // Check root endpoint
    const rootResponse = await fetch(`${BACKEND_URL}/`);
    if (rootResponse.ok) {
      const data = await rootResponse.json();
      console.log('✅ Backend is running!');
      console.log('Version:', data.version);
      console.log('Available endpoints:', Object.keys(data.endpoints).join(', '));
      console.log('');
    } else {
      console.log('❌ Backend returned error:', rootResponse.status);
      return false;
    }

    // Check health endpoint
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Health check:', health.status);
      console.log('');
    }

    // Check if all ML endpoints are registered
    console.log('📋 Checking ML endpoints...');
    const endpoints = [
      '/aadhar/verify',
      '/pan/verify',
      '/face/verify',
      '/manipulation/check'
    ];

    for (const endpoint of endpoints) {
      try {
        // OPTIONS request to check if endpoint exists
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
          method: 'OPTIONS'
        });
        console.log(`  ${endpoint}: ${response.ok ? '✅ Available' : '⚠️  Unknown'}`);
      } catch (error) {
        console.log(`  ${endpoint}: ❌ Not accessible`);
      }
    }

    console.log('');
    console.log('✅ Backend health check complete!');
    return true;

  } catch (error) {
    console.log('❌ Backend is not accessible!');
    console.log('Error:', error.message);
    console.log('');
    console.log('Make sure to start the backend with:');
    console.log('  cd backend');
    console.log('  uvicorn main:app --reload --port 8000');
    return false;
  }
}

// Run the check
checkBackendHealth()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
