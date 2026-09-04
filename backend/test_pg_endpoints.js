async function runTests() {
  const baseUrl = 'http://localhost:5001/api';
  
  try {
    console.log('--- STARTING POSTGRESQL TESTS ---');

    // 1. COURSES
    console.log('\nTesting POST /api/courses...');
    let res = await fetch(`${baseUrl}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Course 1', description: 'Testing POST', userId: 'will-be-invalid-but-zod-catches-it' })
    });
    let data = await res.json();
    console.log('POST Course (Invalid UUID) Status:', res.status); // Expect 400

    // Fetch a real user to use for creating
    // We assume the DB is seeded and the server is running. We will bypass creating if we don't know a valid UUID, 
    // but we can test GET first to grab a course, then get the userId.
    
    console.log('\nTesting GET /api/courses...');
    res = await fetch(`${baseUrl}/courses`);
    data = await res.json();
    console.log('GET Courses Status:', res.status);
    
    if (data.data && data.data.length > 0) {
      const sampleCourse = data.data[0];
      console.log('Sample Course:', sampleCourse.name);

      console.log('\nTesting GET /api/courses/:id...');
      res = await fetch(`${baseUrl}/courses/${sampleCourse.id}`);
      let detailData = await res.json();
      console.log('GET Course Details Status:', res.status);
      console.log('Has Assignments Included:', !!detailData.data.assignments);

      console.log('\nTesting PATCH /api/courses/:id...');
      res = await fetch(`${baseUrl}/courses/${sampleCourse.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sampleCourse.name + ' Updated' })
      });
      let patchData = await res.json();
      console.log('PATCH Course Status:', res.status);
    } else {
      console.log('No courses found from seed to test further.');
    }

    // 2. ASSIGNMENTS
    console.log('\nTesting GET /api/assignments...');
    res = await fetch(`${baseUrl}/assignments`);
    data = await res.json();
    console.log('GET Assignments Status:', res.status);

    // 3. TASKS
    console.log('\nTesting GET /api/tasks...');
    res = await fetch(`${baseUrl}/tasks`);
    data = await res.json();
    console.log('GET Tasks Status:', res.status);

    console.log('\nTesting GET /api/tasks?priority=HIGH&order=desc...');
    res = await fetch(`${baseUrl}/tasks?priority=HIGH&sortBy=priority&order=desc`);
    data = await res.json();
    console.log('GET Tasks Filtered Status:', res.status);

    // 4. DASHBOARD (SQL JOIN)
    if (data.data && data.data.length > 0) {
      const validUserId = data.data[0].userId; // Get a valid user ID from a task
      console.log(`\nTesting GET /api/dashboard?userId=${validUserId}...`);
      res = await fetch(`${baseUrl}/dashboard?userId=${validUserId}`);
      data = await res.json();
      console.log('GET Dashboard Status:', res.status);
      if (data.success) {
        console.log('Dashboard Aggregations:', Object.keys(data.data.stats));
        console.log('Dashboard Upcoming Deadlines Count:', data.data.upcomingDeadlines.length);
      }
    }

    // 5. MISSING RESOURCE 404
    console.log('\nTesting 404 (Missing Resource)...');
    res = await fetch(`${baseUrl}/courses/00000000-0000-0000-0000-000000000000`);
    data = await res.json();
    console.log('GET Missing Course Status:', res.status); // Expect 404

    // 6. TRANSACTION TEST
    if (data.error) {
       // Just grab the first course id from earlier
       const coursesRes = await fetch(`${baseUrl}/courses`);
       const coursesData = await coursesRes.json();
       if (coursesData.data.length > 0) {
         const cId = coursesData.data[0].id;
         const uId = coursesData.data[0].userId;

         console.log('\nTesting POST /api/assignments/with-task (Transaction)...');
         res = await fetch(`${baseUrl}/assignments/with-task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              courseId: cId, 
              title: 'Transactional Assignment', 
              deadline: new Date().toISOString(), 
              userId: uId, 
              initialTaskTitle: 'First Task for Transaction' 
            })
         });
         const txData = await res.json();
         console.log('Transaction Status:', res.status);
         if (txData.success) {
           console.log('Created Assignment and Task together:', txData.data.assignment.id, txData.data.task.id);
         }
       }
    }

    console.log('\n--- TESTS COMPLETED ---');
  } catch (err) {
    console.error("Test failed:", err);
  }
  process.exit(0);
}

runTests();
