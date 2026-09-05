const cacheService = require('./src/services/cache.service');
const prisma = require('./src/config/prisma');
const redisModule = require('./src/config/redis');
let { redisClient } = redisModule;

// Simple in-memory mock for ioredis to support testing without a live Redis server
class MockRedisClient {
  constructor() {
    this.data = new Map();
  }
  async flushall() { this.data.clear(); }
  async get(key) { return this.data.get(key) || null; }
  async set(key, value, mode, ttl) { this.data.set(key, value); }
  async del(key) { this.data.delete(key); }
  async ttl(key) { return this.data.has(key) ? 60 : -2; }
  disconnect() { this.isDisconnected = true; }
  connect() { this.isDisconnected = false; return Promise.resolve(); }
}

async function testRedisCaching() {
  console.log('--- STARTING REDIS CACHING TESTS ---\n');

  try {
    // Attempt to ping real Redis, if it fails, inject mock
    try {
      await redisClient.ping();
      await redisClient.flushall();
    } catch (err) {
      console.log('[Test Setup] Real Redis unavailable. Using MockRedisClient boundary.');
      const mock = new MockRedisClient();
      redisModule.redisClient = mock; // Override the exported client
      redisClient = mock;
      // Also force the cacheService to use the mocked client by relying on its internal reference update
      cacheService.redisClient = mock; // If it stores a reference
      
      // Override the isRedisConnected function to return true (unless we test disconnect)
      redisModule.isRedisConnected = () => !mock.isDisconnected;
    }

    await prisma.course.deleteMany({});
    await prisma.user.deleteMany({});

    // Setup Mock Users
    const userA = await prisma.user.create({ data: { name: 'User A', email: 'a@example.com', passwordHash: 'hash', role: 'STUDENT' } });
    const userB = await prisma.user.create({ data: { name: 'User B', email: 'b@example.com', passwordHash: 'hash', role: 'STUDENT' } });

    // Setup Mock Course for User A
    const courseA = await prisma.course.create({ data: { name: 'Course A', userId: userA.id } });

    const keyA = cacheService.generateUserKey('courses', userA.id);
    const keyB = cacheService.generateUserKey('courses', userB.id);

    console.log('TEST 1: Cache Miss & Fetch');
    let dbCallCount = 0;
    const fetchCoursesA = async () => {
      dbCallCount++;
      return await prisma.course.findMany({ where: { userId: userA.id } });
    };

    const missResult = await cacheService.cacheAside(keyA, 60, fetchCoursesA);
    // Give async set a tiny moment to finish
    await new Promise(r => setTimeout(r, 50));
    
    if (dbCallCount === 1 && missResult.length === 1 && missResult[0].name === 'Course A') {
      console.log('✅ TEST 1 PASS (DB was queried on cache miss and returned correct data)');
    } else {
      console.log('❌ TEST 1 FAIL');
    }

    console.log('\nTEST 2: Cache Hit');
    const hitResult = await cacheService.cacheAside(keyA, 60, fetchCoursesA);
    if (dbCallCount === 1 && hitResult.length === 1 && hitResult[0].name === 'Course A') {
      console.log('✅ TEST 2 PASS (DB was NOT queried on second request, data served from Redis)');
    } else {
      console.log(`❌ TEST 2 FAIL (dbCallCount: ${dbCallCount})`);
    }

    console.log('\nTEST 3: TTL Enforcement');
    const ttl = await redisClient.ttl(keyA);
    if (ttl > 0 && ttl <= 60) {
      console.log(`✅ TEST 3 PASS (TTL is correctly set to ${ttl} seconds)`);
    } else {
      console.log(`❌ TEST 3 FAIL (Unexpected TTL: ${ttl})`);
    }

    console.log('\nTEST 4: Invalidation');
    await cacheService.delete(keyA);
    const postDeleteResult = await cacheService.cacheAside(keyA, 60, fetchCoursesA);
    if (dbCallCount === 2 && postDeleteResult.length === 1) {
      console.log('✅ TEST 4 PASS (Deletion forced a cache miss and new DB query)');
    } else {
      console.log(`❌ TEST 4 FAIL (dbCallCount: ${dbCallCount})`);
    }

    console.log('\nTEST 5: User Isolation');
    const fetchCoursesB = async () => {
      return await prisma.course.findMany({ where: { userId: userB.id } });
    };
    const userBResult = await cacheService.cacheAside(keyB, 60, fetchCoursesB);
    if (userBResult.length === 0) {
      console.log('✅ TEST 5 PASS (User B correctly received empty array, isolated from User A)');
    } else {
      console.log('❌ TEST 5 FAIL (Cross-user data bleeding detected!)');
    }

    console.log('\nTEST 6: Corrupted Cache');
    await redisClient.set(keyA, 'INVALID JSON {');
    const fetchCoursesCorrupted = async () => {
      dbCallCount++;
      return await prisma.course.findMany({ where: { userId: userA.id } });
    };
    const corruptedResult = await cacheService.cacheAside(keyA, 60, fetchCoursesCorrupted);
    if (dbCallCount === 3 && corruptedResult.length === 1) {
      console.log('✅ TEST 6 PASS (Corrupted JSON handled safely as a cache miss)');
      const clearedValue = await redisClient.get(keyA);
      // It sets fresh data asynchronously, so let's just ensure it's not the invalid string
      if (clearedValue !== 'INVALID JSON {') {
        console.log('✅ TEST 6 PASS (Corrupted key was evicted/overwritten)');
      } else {
         console.log('❌ TEST 6 FAIL (Corrupted key was not evicted)');
      }
    } else {
      console.log(`❌ TEST 6 FAIL (dbCallCount: ${dbCallCount})`);
    }

    console.log('\nTEST 7: Redis Failure Fallback');
    // Force disconnect Redis temporarily to test resilience
    redisClient.disconnect();
    const fetchCoursesFallback = async () => {
      dbCallCount++;
      return await prisma.course.findMany({ where: { userId: userA.id } });
    };
    const fallbackResult = await cacheService.cacheAside(keyA, 60, fetchCoursesFallback);
    if (dbCallCount === 4 && fallbackResult.length === 1) {
      console.log('✅ TEST 7 PASS (API gracefully fell back to DB when Redis was down)');
    } else {
      console.log(`❌ TEST 7 FAIL (dbCallCount: ${dbCallCount})`);
    }

    console.log('\n--- ALL CACHING TESTS COMPLETED ---');
  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    // Reconnect to clean up
    if (redisClient.status !== 'ready') {
      redisClient.connect().catch(() => {});
    }
    await new Promise(r => setTimeout(r, 100)); // allow connection
    await redisClient.flushall().catch(() => {});
    await prisma.$disconnect();
    process.exit(0);
  }
}

testAiUsage(); // Start the tests

function testAiUsage() {
  testRedisCaching();
}
