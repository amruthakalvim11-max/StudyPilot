const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5001/api';
let jwtToken = '';

async function runTests() {
  console.log('--- STARTING RAG INGESTION PIPELINE TESTS ---\n');

  try {
    // 1. Get a token
    let res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'RAG Test User',
        email: `ragtest_${Date.now()}@example.com`,
        password: 'securepassword123'
      })
    });
    let data = await res.json();
    jwtToken = data.data.token;

    // 2. Prepare test files
    const dummyTxtPath = path.join(__dirname, 'dummy.txt');
    fs.writeFileSync(dummyTxtPath, 'This is a test document. It contains some very basic knowledge for testing text extraction and chunking. '.repeat(100)); // Large enough to chunk

    const emptyTxtPath = path.join(__dirname, 'empty.txt');
    fs.writeFileSync(emptyTxtPath, '   \n  '); // Whitespace only

    // 3. Test Unauthenticated Upload
    console.log('Testing POST /api/materials (Without Auth)...');
    res = await fetch(`${API_URL}/materials`, { method: 'POST' });
    console.log(`Status (Expected 401): ${res.status}\n`);

    // 4. Test Valid TXT Upload (Mock Embeddings)
    console.log('Testing POST /api/materials (Valid TXT, Mock Embeddings)...');
    
    // Construct multipart/form-data manually using standard FormData (Node 18+)
    const formData = new FormData();
    const fileBlob = new Blob([fs.readFileSync(dummyTxtPath)], { type: 'text/plain' });
    formData.append('file', fileBlob, 'dummy.txt');

    res = await fetch(`${API_URL}/materials`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${jwtToken}`,
        'X-Test-Mock-AI': 'true' // Request mock response for embeddings
      },
      body: formData
    });
    data = await res.json();
    console.log(`Status (Expected 201): ${res.status}`);
    
    if (data.success) {
      console.log('Material Created Successfully:');
      console.log('- Status:', data.data.processingStatus);
      console.log('- Chunks Generated:', data.data.chunksGenerated);
      console.log('- Expected > 0 chunks:', data.data.chunksGenerated > 0);
    } else {
      console.log('Upload Failed:', data);
    }
    console.log('');

    // 5. Test Empty/Whitespace File
    console.log('Testing POST /api/materials (Empty TXT)...');
    const emptyFormData = new FormData();
    const emptyBlob = new Blob([fs.readFileSync(emptyTxtPath)], { type: 'text/plain' });
    emptyFormData.append('file', emptyBlob, 'empty.txt');

    res = await fetch(`${API_URL}/materials`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${jwtToken}` },
      body: emptyFormData
    });
    data = await res.json();
    console.log(`Status (Expected 400): ${res.status}`);
    console.log(`Error Message: ${data.error ? data.error.message : 'Unknown'}\n`);

    // Cleanup
    if (fs.existsSync(dummyTxtPath)) fs.unlinkSync(dummyTxtPath);
    if (fs.existsSync(emptyTxtPath)) fs.unlinkSync(emptyTxtPath);

    console.log('--- RAG INGESTION TESTS COMPLETED ---');
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

runTests();
