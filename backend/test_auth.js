const API_URL = 'http://localhost:5001/api';
let jwtToken = '';

async function runTests() {
  console.log('--- STARTING AUTHENTICATION & SECURITY TESTS ---\n');

  try {
    // 1. Test Registration
    console.log('Testing POST /api/auth/register...');
    let res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Auth Test User',
        email: `authtest_${Date.now()}@example.com`,
        password: 'securepassword123'
      })
    });
    let data = await res.json();
    console.log(`POST Register Status: ${res.status}`);
    if (res.status === 201) {
      console.log('User registered successfully.');
      jwtToken = data.data.token;
      if (data.data.user.passwordHash) {
         console.error('ERROR: passwordHash was leaked in registration response!');
      }
    } else {
      console.log('Registration failed:', data);
    }
    console.log('');

    // 2. Test Invalid Login
    console.log('Testing POST /api/auth/login (Invalid Password)...');
    res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid_user@example.com',
        password: 'wrongpassword'
      })
    });
    console.log(`POST Login (Invalid) Status: ${res.status}`);
    console.log('');

    // 3. Test JWT Verification (GET /api/auth/me)
    console.log('Testing GET /api/auth/me (Missing Token)...');
    res = await fetch(`${API_URL}/auth/me`);
    console.log(`GET /me (Missing Token) Status: ${res.status}`);
    console.log('');

    console.log('Testing GET /api/auth/me (Valid Token)...');
    res = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });
    data = await res.json();
    console.log(`GET /me (Valid Token) Status: ${res.status}`);
    if (data.success) {
      console.log(`Authenticated User: ${data.data.email}, Role: ${data.data.role}`);
    }
    console.log('');

    // 4. Test Protected Route Access
    console.log('Testing GET /api/courses (Without Auth)...');
    res = await fetch(`${API_URL}/courses`);
    console.log(`GET /courses (Without Auth) Status: ${res.status}`);
    console.log('');

    console.log('Testing GET /api/courses (With Auth)...');
    res = await fetch(`${API_URL}/courses`, {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });
    console.log(`GET /courses (With Auth) Status: ${res.status}`);
    console.log('');

    // 5. Test Rate Limiting
    console.log('Testing Rate Limiting on /api/auth/login...');
    for (let i = 0; i < 12; i++) {
      res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'test' })
      });
      if (res.status === 429) {
        console.log(`Rate limit triggered on attempt ${i + 1}: Status 429`);
        break;
      }
    }
    console.log('');

    console.log('--- AUTHENTICATION & SECURITY TESTS COMPLETED ---');
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

runTests();
