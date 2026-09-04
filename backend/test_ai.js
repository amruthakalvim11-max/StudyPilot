const API_URL = 'http://localhost:5001/api';
let jwtToken = '';

async function runTests() {
  console.log('--- STARTING AI INTEGRATION TESTS (MOCK MODE) ---\n');

  try {
    // 1. Get a token (Register dummy user if needed, or just login)
    let res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'AI Test User',
        email: `aitest_${Date.now()}@example.com`,
        password: 'securepassword123'
      })
    });
    let data = await res.json();
    jwtToken = data.data.token;

    // 2. Test Unauthenticated Access
    console.log('Testing POST /api/ai/ask (Without Auth)...');
    res = await fetch(`${API_URL}/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'How do I learn calculus?' })
    });
    console.log(`Status (Expected 401): ${res.status}`);
    console.log('');

    // 3. Test Invalid Prompt (Zod Validation)
    console.log('Testing POST /api/ai/ask (Invalid short prompt)...');
    res = await fetch(`${API_URL}/ai/ask`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ prompt: 'x' }) // Too short
    });
    data = await res.json();
    console.log(`Status (Expected 400): ${res.status}`);
    console.log(`Error Message: ${data.error.message}`);
    console.log('');

    // 4. Test Valid Prompt (Mock Mode)
    console.log('Testing POST /api/ai/ask (Valid Prompt, Mocked)...');
    res = await fetch(`${API_URL}/ai/ask`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
        'X-Test-Mock-AI': 'true' // Request mock response to save API quota
      },
      body: JSON.stringify({ prompt: 'How do I plan my week?' })
    });
    data = await res.json();
    console.log(`Status (Expected 200): ${res.status}`);
    
    if (data.success) {
      console.log('Structured AI Output Validated Successfully:');
      console.log('- Response Field Present:', !!data.data.response);
      console.log('- Suggestions Field Present (Array):', Array.isArray(data.data.suggestions));
      console.log('- Encouragement Field Present:', !!data.data.encouragement);
    } else {
      console.log('AI Request Failed:', data);
    }
    console.log('');

    console.log('--- AI TESTS COMPLETED ---');
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

runTests();
