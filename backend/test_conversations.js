async function runTests() {
  const baseUrl = 'http://localhost:5001/api/conversations';
  
  try {
    console.log('Testing POST /api/conversations...');
    let res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user_123', title: 'Test Conversation', initialMessage: { role: 'user', content: 'Hello AI' } })
    });
    let data = await res.json();
    console.log('POST Status:', res.status);
    console.log('POST Response:', data);

    const conversationId = data.data._id;

    console.log('\nTesting GET /api/conversations...');
    res = await fetch(`${baseUrl}?userId=user_123`);
    data = await res.json();
    console.log('GET All Status:', res.status);
    console.log('GET All Count:', data.data.length);

    console.log('\nTesting GET /api/conversations/:id...');
    res = await fetch(`${baseUrl}/${conversationId}`);
    data = await res.json();
    console.log('GET By ID Status:', res.status);
    console.log('GET By ID Title:', data.data.title);

    console.log('\nTesting PATCH /api/conversations/:id...');
    res = await fetch(`${baseUrl}/${conversationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newMessage: { role: 'assistant', content: 'Hello Human!' } })
    });
    data = await res.json();
    console.log('PATCH Status:', res.status);
    console.log('PATCH Messages length:', data.data.messages.length);

    console.log('\nTesting DELETE /api/conversations/:id...');
    res = await fetch(`${baseUrl}/${conversationId}`, { method: 'DELETE' });
    data = await res.json();
    console.log('DELETE Status:', res.status);
    console.log('DELETE Response:', data);

    // Test Validation (Error Handling)
    console.log('\nTesting validation (POST without title)...');
    res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user_123' })
    });
    data = await res.json();
    console.log('POST Error Status:', res.status); // should be 400
    console.log('POST Error Response:', data);

  } catch (err) {
    console.error("Test failed:", err);
  }
  process.exit(0);
}

runTests();
