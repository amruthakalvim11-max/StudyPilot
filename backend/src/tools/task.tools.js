const { z } = require('zod');
const prisma = require('../config/prisma');

const declaration = {
  name: 'get_tasks',
  description: 'Retrieves the list of tasks for the authenticated user, optionally filtered by status or priority.',
  parameters: {
    type: 'OBJECT',
    properties: {
      status: { 
        type: 'STRING', 
        description: 'Filter by task status: TODO, IN_PROGRESS, or COMPLETED.',
        enum: ['TODO', 'IN_PROGRESS', 'COMPLETED']
      },
      priority: { 
        type: 'STRING', 
        description: 'Filter by task priority: LOW, MEDIUM, or HIGH.',
        enum: ['LOW', 'MEDIUM', 'HIGH']
      },
      limit: { 
        type: 'INTEGER', 
        description: 'Maximum number of tasks to return (1-50). Default is 50.' 
      }
    }
  }
};

const schema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  limit: z.number().int().min(1).max(50).default(50).optional()
});

async function handler(args, context) {
  const { status, priority, limit } = args;

  const whereClause = { userId: context.id };
  if (status) whereClause.status = status;
  if (priority) whereClause.priority = priority;

  const tasks = await prisma.task.findMany({
    where: whereClause,
    take: limit || 50,
    select: {
      id: true,
      title: true,
      priority: true,
      status: true,
      dueDate: true,
      assignmentId: true
    },
    orderBy: [
      { dueDate: 'asc' },
      { priority: 'desc' }
    ]
  });

  return { tasks };
}

module.exports = { declaration, schema, handler };
