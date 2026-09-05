const { z } = require('zod');
const prisma = require('../config/prisma');

const declaration = {
  name: 'get_courses',
  description: 'Retrieves the list of courses enrolled by the authenticated user.',
  parameters: {
    type: 'OBJECT',
    properties: {
      limit: { type: 'INTEGER', description: 'Maximum number of courses to return (1-50). Default is 50.' }
    }
  }
};

const schema = z.object({
  limit: z.number().int().min(1).max(50).default(50).optional()
});

async function handler(args, context) {
  const { limit } = args;
  
  const courses = await prisma.course.findMany({
    where: { userId: context.id },
    take: limit || 50,
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return { courses };
}

module.exports = { declaration, schema, handler };
