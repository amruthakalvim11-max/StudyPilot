const { executeTool } = require('./src/tools/index');
const prisma = require('./src/config/prisma');

async function testTools() {
  console.log('--- STARTING FUNCTION CALLING SECURITY TESTS ---\n');

  try {
    // 1. Setup Mock User
    const user = await prisma.user.create({
      data: {
        name: 'Tool Tester',
        email: `tester_${Date.now()}@example.com`,
        passwordHash: 'hashed',
        role: 'STUDENT'
      }
    });

    // Create a mock task for this user
    await prisma.task.create({
      data: {
        userId: user.id,
        title: 'Finish Physics Homework',
        priority: 'HIGH'
      }
    });
    
    // Create another user to test isolation
    const victimUser = await prisma.user.create({
      data: {
        name: 'Victim User',
        email: `victim_${Date.now()}@example.com`,
        passwordHash: 'hashed',
        role: 'STUDENT'
      }
    });
    
    await prisma.task.create({
      data: {
        userId: victimUser.id,
        title: 'Secret Notes',
        priority: 'HIGH'
      }
    });

    console.log('1. Testing unknown tool rejection...');
    const res1 = await executeTool('delete_database', {}, user);
    console.log(`Result: ${JSON.stringify(res1)}`);
    if (res1.error && res1.error.includes('not recognized')) {
      console.log('✅ Unknown tool safely rejected.\n');
    } else {
      console.error('❌ Unknown tool test failed!');
    }

    console.log('2. Testing argument validation...');
    const res2 = await executeTool('get_tasks', { limit: 999 }, user);
    console.log(`Result: ${JSON.stringify(res2)}`);
    if (res2.error && res2.error.includes('Validation failed')) {
      console.log('✅ Tool argument validation working.\n');
    } else {
      console.error('❌ Tool argument validation failed!');
    }

    console.log('3. Testing valid execution (get_tasks)...');
    const res3 = await executeTool('get_tasks', { priority: 'HIGH' }, user);
    console.log(`Tasks Retrieved: ${res3.tasks.length}`);
    if (res3.tasks.length === 1 && res3.tasks[0].title === 'Finish Physics Homework') {
      console.log('✅ Valid tool execution succeeded.\n');
    } else {
      console.error('❌ Valid tool execution failed!');
    }

    console.log('4. Testing Cross-User Data Isolation (Prompt Injection)...');
    // Simulate malicious LLM trying to inject victimUser.id
    const res4 = await executeTool('get_tasks', { userId: victimUser.id }, user);
    // The executor MUST strip `userId` and use `user.id`
    console.log(`Tasks Retrieved: ${res4.tasks.length}`);
    if (res4.tasks.length === 1 && res4.tasks[0].title === 'Finish Physics Homework') {
      console.log('✅ Cross-User Isolation succeeded. Malicious userId was ignored.\n');
    } else {
      console.error('❌ Cross-User Isolation failed! Data leak detected.');
    }

    console.log('--- FUNCTION CALLING TESTS COMPLETED ---');
  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTools();
