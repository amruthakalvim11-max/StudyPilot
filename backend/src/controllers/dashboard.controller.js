const prisma = require('../config/prisma');

// Demonstrates a genuine SQL JOIN via Prisma relational queries and groupBy aggregations
exports.getDashboardData = async (req, res, next) => {
  try {
    const userId = req.user.id; // Enforce ownership from JWT

    // 1. Get Total Courses
    const totalCourses = await prisma.course.count({ where: { userId } });

    // 2. Get Total Assignments (via Courses)
    const totalAssignments = await prisma.assignment.count({
      where: { course: { userId } }
    });

    // 3. Get Task Counts by Status
    const tasksGroupByStatus = await prisma.task.groupBy({
      by: ['status'],
      where: { userId },
      _count: { id: true }
    });

    const taskCounts = {
      TODO: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0
    };
    tasksGroupByStatus.forEach(group => {
      taskCounts[group.status] = group._count.id;
    });

    // 4. Get Upcoming Deadlines (Assignments due in next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingDeadlines = await prisma.assignment.findMany({
      where: {
        course: { userId },
        status: { not: 'COMPLETED' },
        deadline: {
          gte: new Date(),
          lte: nextWeek
        }
      },
      orderBy: { deadline: 'asc' },
      take: 5,
      include: { course: { select: { name: true } } }
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalCourses,
          totalAssignments,
          taskCounts,
          totalPendingTasks: taskCounts.TODO + taskCounts.IN_PROGRESS
        },
        upcomingDeadlines: upcomingTasks,
        activeCoursesStructure: userWithCourses.courses // full hierarchy
      }
    });

  } catch (error) {
    next(error);
  }
};
