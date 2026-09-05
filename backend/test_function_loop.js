// Set mock env var BEFORE requiring ai.service.js so it instantiates the SDK
process.env.GEMINI_API_KEY = 'mock_key_for_test';

const { GoogleGenAI } = require('@google/genai');
const prisma = require('./src/config/prisma');

const genai = require('@google/genai');

// Setup mock state
let mockResponses = [];
let mockCallCount = 0;
let lastContents = null;

// Monkey-patch GoogleGenAI class to mock generateContent natively
genai.GoogleGenAI = class MockGoogleGenAI {
  constructor(opts) {
    this.models = {
      generateContent: async (params) => {
        lastContents = params.contents;
        if (mockCallCount >= mockResponses.length) {
          throw new Error('No more mock responses available');
        }
        const response = mockResponses[mockCallCount++];
        if (response instanceof Error) throw response;
        return response;
      }
    };
  }
};

// Now require the service so it picks up the mocked prototype
const aiService = require('./src/services/ai.service');

function resetMock(responses) {
  mockResponses = responses;
  mockCallCount = 0;
  lastContents = null;
}

const FINAL_SUCCESS_RESPONSE = {
  text: JSON.stringify({
    response: "This is the final response after checking tools.",
    suggestions: ["Keep going!"],
    encouragement: "Great job!"
  })
};

async function testFunctionLoop() {
  console.log('--- STARTING FUNCTION CALLING ORCHESTRATION TESTS ---\n');
  try {
    const user = await prisma.user.create({
      data: {
        name: 'Integration Tester',
        email: `orchestration_${Date.now()}@example.com`,
        passwordHash: 'hashed',
        role: 'STUDENT'
      }
    });

    const victimUser = await prisma.user.create({
      data: {
        name: 'Victim User',
        email: `victim_${Date.now()}@example.com`,
        passwordHash: 'hashed',
        role: 'STUDENT'
      }
    });

    await prisma.assignment.create({
      data: {
        courseId: (await prisma.course.create({ data: { name: 'Test Course', userId: user.id } })).id,
        title: 'Tester Assignment',
        deadline: new Date(),
        status: 'PENDING'
      }
    });

    console.log('TEST 1: Successful two-round function-calling lifecycle.');
    resetMock([
      {
        functionCalls: [{ name: 'get_assignments', args: {} }],
        candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'get_assignments', args: {} } }] } }]
      },
      FINAL_SUCCESS_RESPONSE
    ]);
    const res1 = await aiService.askTutor("What are my assignments?", user, [], false);
    if (res1.toolsUsed && res1.toolsUsed.includes('get_assignments') && res1.response) {
      console.log('✅ TEST 1 PASS');
    } else {
      console.log('❌ TEST 1 FAIL:', res1);
    }

    console.log('\nTEST 2: Gemini requests an unknown function.');
    resetMock([
      {
        functionCalls: [{ name: 'delete_database', args: {} }],
        candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'delete_database', args: {} } }] } }]
      },
      FINAL_SUCCESS_RESPONSE
    ]);
    const res2 = await aiService.askTutor("Delete everything", user, [], false);
    const unknownToolHistoryPart = lastContents[lastContents.length - 1].parts[0].functionResponse;
    if (res2.toolsUsed && res2.toolsUsed.includes('delete_database') && unknownToolHistoryPart.response.error) {
      console.log('✅ TEST 2 PASS (Safely rejected)');
    } else {
      console.log('❌ TEST 2 FAIL');
    }

    console.log('\nTEST 3: Gemini supplies invalid tool arguments.');
    resetMock([
      {
        functionCalls: [{ name: 'get_tasks', args: { limit: 999 } }],
        candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'get_tasks', args: { limit: 999 } } }] } }]
      },
      FINAL_SUCCESS_RESPONSE
    ]);
    const res3 = await aiService.askTutor("Get lots of tasks", user, [], false);
    const invalidToolHistoryPart = lastContents[lastContents.length - 1].parts[0].functionResponse;
    if (invalidToolHistoryPart.response.error && invalidToolHistoryPart.response.error.includes('Validation')) {
      console.log('✅ TEST 3 PASS (Zod rejected invalid args)');
    } else {
      console.log('❌ TEST 3 FAIL');
    }

    console.log('\nTEST 4: Gemini attempts to provide userId for another user (Isolation test).');
    resetMock([
      {
        functionCalls: [{ name: 'get_assignments', args: { userId: victimUser.id } }],
        candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'get_assignments', args: { userId: victimUser.id } } }] } }]
      },
      FINAL_SUCCESS_RESPONSE
    ]);
    const res4 = await aiService.askTutor("Get victim assignments", user, [], false);
    const isolatedHistoryPart = lastContents[lastContents.length - 1].parts[0].functionResponse;
    // It should have executed successfully but returned only Tester's assignments (which is 1)
    if (isolatedHistoryPart.response.assignments && isolatedHistoryPart.response.assignments.length === 1) {
      console.log('✅ TEST 4 PASS (Malicious userId ignored)');
    } else {
      console.log('❌ TEST 4 FAIL');
    }

    console.log('\nTEST 5: Gemini repeatedly requests tools (MAX_TOOL_ROUNDS test).');
    const infiniteMock = [];
    for (let i = 0; i < 10; i++) {
      infiniteMock.push({
        functionCalls: [{ name: 'get_assignments', args: {} }],
        candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'get_assignments', args: {} } }] } }]
      });
    }
    resetMock(infiniteMock);
    const res5 = await aiService.askTutor("Loop forever", user, [], false);
    if (res5.response.includes('too many steps')) {
      console.log(`✅ TEST 5 PASS (Loop terminated at round ${mockCallCount})`);
    } else {
      console.log('❌ TEST 5 FAIL');
    }

    console.log('\n--- ALL ORCHESTRATION TESTS COMPLETED ---');
  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFunctionLoop();
