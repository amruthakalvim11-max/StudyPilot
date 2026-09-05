const { z } = require('zod');
const prisma = require('../config/prisma');

const declaration = {
  name: 'get_assignments',
  description: 'Retrieves assignments for the authenticated user, optionally filtered by status or date.',
  parameters: {
    type: 'OBJECT',
    properties: {
      status: { 
        type: 'STRING', 
        description: 'Filter by assignment status: PENDING, IN_PROGRESS, or COMPLETED.',
        enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED']
      },
      courseId: {
        type: 'STRING',
        description: 'Filter assignments by a specific course ID.'
      },
      limit: { 
        type: 'INTEGER', 
        description: 'Maximum number of assignments to return (1-50). Default is 50.' 
      }
    }
  }
};

const schema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  courseId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(50).default(50).optional()
});

async function handler(args, context) {
  const { status, courseId, limit } = args;

  // Enforce ownership heavily. Since assignments belong to courses, we check course.userId
  const whereClause = {
    course: {
      userId: context.id
    }
  };

  if (status) whereClause.status = status;
  if (courseId) whereClause.courseId = courseId;

  const assignments = await prisma.assignment.findMany({
    where: whereClause,
    take: limit || 50,
    select: {
      id: true,
      courseId: true,
      title: true,
      description: true,
      deadline: true,
      status: true,
      course: {
        select: { name: true }
      }
    },
    orderBy: { deadline: 'asc' }
  });

  return { assignments };
}

module.exports = { declaration, schema, handler };
