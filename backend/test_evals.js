const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('--- STARTING EVALUATION FRAMEWORK TESTS ---\n');

try {
  // 1. Verify Dataset loads and validates
  const datasetPath = path.join(__dirname, 'evals', 'dataset.v1.json');
  if (!fs.existsSync(datasetPath)) throw new Error('Dataset file missing');
  
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
  console.log('✅ Dataset loaded successfully');

  if (!Array.isArray(dataset) || dataset.length < 15) {
    throw new Error('Dataset must contain at least 15 cases');
  }
  console.log('✅ Dataset contains sufficient evaluation cases');

  // Verify categories
  const categories = new Set(dataset.map(c => c.category));
  const requiredCategories = ['basic_qa', 'rag_grounded', 'rag_refusal', 'prompt_injection', 'structured_output', 'tool_use', 'user_isolation', 'out_of_scope'];
  for (const req of requiredCategories) {
    if (!categories.has(req)) throw new Error(`Missing required category: ${req}`);
  }
  console.log('✅ All required evaluation categories are present');

  // 2. Execute Mock Evaluator Run
  console.log('\nExecuting run_evals.js --mode=mock ...');
  
  // We execute it in a child process so it doesn't collide with our memory/vars
  try {
    execSync('node evals/run_evals.js --mode=mock', { cwd: __dirname, stdio: 'inherit' });
    console.log('✅ Evaluator executed successfully without throwing thresholds');
  } catch (err) {
    console.error('❌ Evaluator threw an error or failed threshold checks. Ensure mock setup in run_evals.js satisfies the dataset.');
    process.exit(1);
  }

  // 3. Verify Results File
  const resultsPath = path.join(__dirname, 'evals', 'results', 'latest.json');
  if (!fs.existsSync(resultsPath)) throw new Error('Results file was not generated');
  
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  console.log('✅ Machine-readable results generated');

  if (results.totalCases !== dataset.length || results.mode !== 'mock' || typeof results.passRate !== 'number') {
    throw new Error('Results file contains malformed data');
  }
  console.log('✅ Results data structure is valid');
  
  if (results.passRate !== 1.0) {
    console.log(`⚠️ Note: Mock evaluation pass rate is ${(results.passRate * 100).toFixed(1)}%. Expected 100% since mocks are designed to pass.`);
  }

  // 4. Test Threshold Enforcement
  console.log('\nTesting Threshold Enforcement (Simulating a regression)...');
  // Inject a failure into a security category (prompt_injection) which requires 100% pass rate
  dataset[6].expected.mustNotContain = ['Normal'];
  fs.writeFileSync(datasetPath, JSON.stringify(dataset, null, 2));
  
  let thresholdCaught = false;
  try {
    execSync('node evals/run_evals.js --mode=mock', { cwd: __dirname, stdio: 'pipe' });
  } catch (err) {
    thresholdCaught = true;
  }
  
  // Restore dataset
  delete dataset[6].expected.mustNotContain;
  fs.writeFileSync(datasetPath, JSON.stringify(dataset, null, 2));

  if (thresholdCaught) {
    console.log('✅ Security threshold failures properly exit with non-zero status');
  } else {
    throw new Error('Evaluator failed to catch simulated regression');
  }

  console.log('\n--- ALL EVALUATION FRAMEWORK TESTS COMPLETED SUCCESSFULLY ---');

} catch (error) {
  console.error('\n❌ Evaluation Framework Test Failed:', error.message);
  process.exit(1);
}
