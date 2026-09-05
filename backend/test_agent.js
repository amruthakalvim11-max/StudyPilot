// Set mock env var BEFORE requiring ai.service.js so it instantiates the SDK
process.env.GEMINI_API_KEY = 'mock_key_for_test';

const genai = require('@google/genai');
const prisma = require('./src/config/prisma');

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
        
        response.usageMetadata = {
          promptTokenCount: 200,
          candidatesTokenCount: 100,
          totalTokenCount: 300
        };
        
        return response;
      }
    };
  }
};

const agentService = require('./src/services/agent.service');

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

async function testAgent() {
  console.log('--- STARTING AGENT ORCHESTRATION TESTS ---\n');
  try {
    const user = await prisma.user.create({
      data: {
        name: 'Agent Tester',
        email: `agent_${Date.now()}@example.com`,
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

    const course = await prisma.course.create({ data: { name: 'Test Course', userId: user.id } });
    await prisma.assignment.create({
      data: {
        courseId: course.id,
        title: 'Tester Assignment',
        deadline: new Date(),
        status: 'PENDING'
      }
    });

    console.log('TEST 1: Real Multi-Step Lifecycle (Adaptive tools based on result)');
    resetMock([
      { // Turn 1: request assignments
        functionCalls: [{ name: 'get_assignments', args: {} }],
        candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'get_assignments', args: {} } }] } }]
      },
      { // Turn 2: based on assignments, request materials
        functionCalls: [{ name: 'get_study_materials', args: {} }],
        candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'get_study_materials', args: {} } }] } }]
      },
      FINAL_SUCCESS_RESPONSE // Turn 3: Final response
    ]);
    const res1 = await agentService.runAgent("What should I study?", user, [], false);
    
    // Assert multiple different tools used, final response returned
    if (res1.toolsUsed && res1.toolsUsed.includes('get_assignments') && res1.toolsUsed.includes('get_study_materials') && res1.stepsUsed === 3) {
      console.log('✅ TEST 1 PASS');
    } else {
      console.log('❌ TEST 1 FAIL:', res1);
    }

    console.log('\nTEST 2: Adaptive Next Step Verification');
    // We implicitly tested this above (the 2nd turn was passed back into the loop natively),
    // but let's verify that the agent's history length proves it.
    if (lastContents.length === 5) {
      // 1 (user prompt) + 2 (model call 1 + result 1) + 2 (model call 2 + result 2)
      console.log('✅ TEST 2 PASS (History length proves adaptive observation)');
    } else {
      console.log('❌ TEST 2 FAIL: History length is', lastContents.length);
    }

    console.log('\nTEST 3: User Isolation');
    resetMock([
      {
        functionCalls: [{ name: 'get_assignments', args: { userId: victimUser.id } }],
        candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'get_assignments', args: { userId: victimUser.id } } }] } }]
      },
      FINAL_SUCCESS_RESPONSE
    ]);
    const res3 = await agentService.runAgent("Get victim assignments", user, [], false);
    const isolatedHistoryPart = lastContents[lastContents.length - 1].parts[0].functionResponse;
    if (isolatedHistoryPart.response.assignments && isolatedHistoryPart.response.assignments.length === 1) {
      console.log('✅ TEST 3 PASS (Malicious userId ignored)');
    } else {
      console.log('❌ TEST 3 FAIL');
    }

    console.log('\nTEST 4: Invalid Tool Arguments');
    resetMock([
      {
        functionCalls: [{ name: 'get_tasks', args: { limit: 999 } }],
        candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'get_tasks', args: { limit: 999 } } }] } }]
      },
      FINAL_SUCCESS_RESPONSE
    ]);
    const res4 = await agentService.runAgent("Get lots of tasks", user, [], false);
    const invalidToolHistoryPart = lastContents[lastContents.length - 1].parts[0].functionResponse;
    if (invalidToolHistoryPart.response.error && invalidToolHistoryPart.response.error.includes('Validation')) {
      console.log('✅ TEST 4 PASS (Zod rejected invalid args)');
    } else {
      console.log('❌ TEST 4 FAIL');
    }

    console.log('\nTEST 5: Unknown Tool');
    resetMock([
      {
        functionCalls: [{ name: 'delete_database', args: {} }],
        candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'delete_database', args: {} } }] } }]
      },
      FINAL_SUCCESS_RESPONSE
    ]);
    const res5 = await agentService.runAgent("Delete everything", user, [], false);
    const unknownToolHistoryPart = lastContents[lastContents.length - 1].parts[0].functionResponse;
    if (res5.toolsUsed && res5.toolsUsed.includes('delete_database') && unknownToolHistoryPart.response.error) {
      console.log('✅ TEST 5 PASS (Safely rejected)');
    } else {
      console.log('❌ TEST 5 FAIL');
    }

    console.log('\nTEST 6: Infinite Loop (MAX_AGENT_STEPS)');
    const infiniteMock = [];
    for (let i = 0; i < 15; i++) {
      infiniteMock.push({
        functionCalls: [{ name: 'get_assignments', args: {} }],
        candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'get_assignments', args: {} } }] } }]
      });
    }
    resetMock(infiniteMock);
    const res6 = await agentService.runAgent("Loop forever", user, [], false);
    if (res6.response.includes('too many steps') && res6.stepsUsed === 8) {
      console.log(`✅ TEST 6 PASS (Loop terminated at step ${res6.stepsUsed})`);
    } else {
      console.log('❌ TEST 6 FAIL:', res6.stepsUsed);
    }
    
    console.log('\nTEST 7: Tool Failure');
    resetMock([
      {
        // Mocking a completely broken execution by forcing a throw inside the router or simulating a DB failure if we could
        // Since we can't easily break the real DB here without breaking state, we simulate the tool failure by using invalid UUID syntax for courseId
        functionCalls: [{ name: 'get_assignments', args: { courseId: "invalid-uuid-format" } }],
        candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'get_assignments', args: { courseId: "invalid-uuid-format" } } }] } }]
      },
      FINAL_SUCCESS_RESPONSE
    ]);
    const res7 = await agentService.runAgent("Fail please", user, [], false);
    const failedPart = lastContents[lastContents.length - 1].parts[0].functionResponse;
    if (failedPart.response.error) {
      console.log('✅ TEST 7 PASS (Tool validation/execution failure handled safely without crashing agent)');
    } else {
      console.log('❌ TEST 7 FAIL:', failedPart);
    }

    console.log('\n--- ALL AGENT TESTS COMPLETED ---');
  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAgent();
