const { GoogleGenAI } = require('@google/genai');
const prisma = require('./src/config/prisma');
const aiUsageService = require('./src/services/ai.usage.service');

// Mock Data
const MOCK_METADATA = {
  promptTokenCount: 500,
  candidatesTokenCount: 100,
  totalTokenCount: 600,
  cachedContentTokenCount: null
};

// Monkey Patch GoogleGenAI globally for test execution BEFORE importing services
const genai = require('@google/genai');
let mockResponses = [];
let mockCallCount = 0;

genai.GoogleGenAI = class MockGoogleGenAI {
  constructor() {
    this.models = {
      generateContent: async (params) => {
        if (mockCallCount >= mockResponses.length) throw new Error("No mock response");
        const response = mockResponses[mockCallCount++];
        if (response instanceof Error) throw response;
        return response;
      }
    };
  }
};

process.env.GEMINI_API_KEY = 'mock_key_for_test'; // Must be set before requiring agentService
const agentService = require('./src/services/agent.service');

async function testAiUsage() {
  console.log('--- STARTING AI USAGE & COST MONITORING TESTS ---\n');
  
  try {
    const user = await prisma.user.create({
      data: {
        name: 'Usage Tester',
        email: `usage_${Date.now()}@example.com`,
        passwordHash: 'hashed',
        role: 'STUDENT'
      }
    });

    console.log('TEST 1: Usage Metadata Extraction and Persistance (recordUsage)');
    const record = await aiUsageService.recordUsage({
      userId: user.id,
      model: 'gemini-2.5-flash',
      operation: 'TUTOR',
      usageMetadata: MOCK_METADATA,
      failed: false
    });
    
    if (record.inputTokens === 500 && record.outputTokens === 100 && record.totalTokens === 600) {
      console.log('✅ TEST 1 PASS (Tokens accurately extracted to database fields)');
    } else {
      console.log('❌ TEST 1 FAIL:', record);
    }

    console.log('\nTEST 2: Cost Calculation Accuracy (Math validation)');
    // Input cost: (500 / 1,000,000) * 0.30 = 0.000150
    // Output cost: (100 / 1,000,000) * 2.50 = 0.000250
    // Total cost: 0.00040
    const expectedCost = 0.00040;
    if (Math.abs(record.estimatedTotalCost - expectedCost) < 0.000001) {
      console.log(`✅ TEST 2 PASS (Total cost accurately calculated: $${record.estimatedTotalCost})`);
    } else {
      console.log(`❌ TEST 2 FAIL (Expected $${expectedCost}, got $${record.estimatedTotalCost})`);
    }

    console.log('\nTEST 3: Missing Usage Metadata Handled Safely');
    const missingRecord = await aiUsageService.recordUsage({
      userId: user.id,
      model: 'gemini-2.5-flash',
      operation: 'RAG',
      usageMetadata: null, // explicit null
      failed: false
    });
    
    if (missingRecord.inputTokens === null && missingRecord.estimatedTotalCost === null) {
      console.log('✅ TEST 3 PASS (Cost and usage remain strictly null without fabricating values)');
    } else {
      console.log('❌ TEST 3 FAIL (Fabricated values detected!)', missingRecord);
    }

    console.log('\nTEST 4: Agent Double-Counting & Multi-Step Aggregation');
    // Enable agent useMock = false but force the global mock we set up above
    process.env.GEMINI_API_KEY = 'mock_key_for_test'; // To bypass early exits
    mockCallCount = 0;
    mockResponses = [
      {
        functionCalls: [{ name: 'get_assignments', args: {} }],
        candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'get_assignments', args: {} } }] } }],
        usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 50, totalTokenCount: 150 }
      },
      {
        functionCalls: [{ name: 'get_tasks', args: {} }],
        candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'get_tasks', args: {} } }] } }],
        usageMetadata: { promptTokenCount: 200, candidatesTokenCount: 75, totalTokenCount: 275 }
      },
      {
        text: JSON.stringify({
          response: "Final answer.",
          suggestions: ["A"],
          encouragement: "Great job!"
        }),
        usageMetadata: { promptTokenCount: 150, candidatesTokenCount: 25, totalTokenCount: 175 }
      }
    ];

    // Delete existing usage for isolation
    await prisma.aiUsage.deleteMany({ where: { userId: user.id } });

    // Run agent which should trigger 3 calls to recordUsage internally
    await agentService.runAgent("What are my assignments?", user, [], false);
    
    // Check records
    const agentRecords = await prisma.aiUsage.findMany({ where: { userId: user.id, operation: 'AGENT' } });
    if (agentRecords.length === 3) {
      console.log('✅ TEST 4 PASS (Recorded exactly 3 atomic API calls for the agent workflow)');
      
      const summary = await aiUsageService.getUsageSummary(user.id);
      
      // Expected: Input: 450, Output: 150, Total: 600
      // Expected Cost: (450/1M)*0.30 + (150/1M)*2.50 = 0.000135 + 0.000375 = 0.000510
      const expectedAgentCost = 0.000510;
      
      if (summary.inputTokens === 450 && summary.outputTokens === 150 && summary.totalTokens === 600 && summary.totalRequests === 3) {
        console.log('✅ TEST 5 PASS (Summary perfectly aggregated 600 total tokens across 3 agent multi-steps)');
        
        // Find agent operation summary
        const agentOp = summary.byOperation.find(op => op.operation === 'AGENT');
        if (agentOp && Math.abs(agentOp.totalCost - expectedAgentCost) < 0.000001) {
          console.log(`✅ TEST 6 PASS (Agent operation cost correctly aggregated to $${expectedAgentCost})`);
        } else {
          console.log(`❌ TEST 6 FAIL (Expected agent cost $${expectedAgentCost})`, agentOp);
        }
      } else {
        console.log('❌ TEST 5 FAIL (Agent aggregation mismatch)', summary);
      }
    } else {
      console.log(`❌ TEST 4 FAIL (Agent API call mapping error, expected 3, got ${agentRecords.length})`);
    }
    
    console.log('\n--- ALL USAGE MONITORING TESTS COMPLETED ---');

  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAiUsage();
