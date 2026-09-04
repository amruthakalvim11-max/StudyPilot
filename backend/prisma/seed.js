const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const user1 = await prisma.user.upsert({
    where: { email: 'student1@example.com' },
    update: {},
    create: {
      name: 'Alice Student',
      email: 'student1@example.com',
      passwordHash,
      role: 'STUDENT',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'student2@example.com' },
    update: {},
    create: {
      name: 'Bob Learner',
      email: 'student2@example.com',
      passwordHash,
      role: 'STUDENT',
    },
  });

  const teacher1 = await prisma.user.upsert({
    where: { email: 'teacher1@example.com' },
    update: {},
    create: {
      name: 'Carol Teacher',
      email: 'teacher1@example.com',
      passwordHash,
      role: 'TEACHER',
    },
  });

  console.log('Created users.');

  // 2. Create Courses
  const course1 = await prisma.course.create({
    data: {
      name: 'Introduction to Computer Science',
      description: 'Basic programming concepts.',
      userId: teacher1.id,
    }
  });

  const course2 = await prisma.course.create({
    data: {
      name: 'Web Development Bootcamp',
      description: 'Learn React, Node, and Postgres.',
      userId: teacher1.id,
    }
  });

  console.log('Created courses.');

  // 3. Create Assignments
  const assignment1 = await prisma.assignment.create({
    data: {
      title: 'CS Basics Quiz',
      description: 'Multiple choice quiz on basic logic.',
      deadline: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'PENDING',
      courseId: course1.id,
    }
  });

  const assignment2 = await prisma.assignment.create({
    data: {
      title: 'React Components Essay',
      description: 'Write about the React lifecycle.',
      deadline: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000),
      status: 'IN_PROGRESS',
      courseId: course2.id,
    }
  });

  console.log('Created assignments.');

  // 4. Create Tasks
  await prisma.task.createMany({
    data: [
      {
        userId: user1.id,
        assignmentId: assignment1.id,
        title: 'Review Chapter 1',
        priority: 'HIGH',
        status: 'TODO',
        dueDate: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000)
      },
      {
        userId: user1.id,
        assignmentId: assignment1.id,
        title: 'Take Practice Quiz',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        dueDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000)
      },
      {
        userId: user1.id,
        assignmentId: assignment2.id,
        title: 'Outline Essay',
        priority: 'LOW',
        status: 'COMPLETED',
        dueDate: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        userId: user2.id, // A standalone task without an assignment
        title: 'Buy Notebooks',
        priority: 'LOW',
        status: 'TODO',
        dueDate: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000)
      }
    ]
  });

  console.log('Created tasks.');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
