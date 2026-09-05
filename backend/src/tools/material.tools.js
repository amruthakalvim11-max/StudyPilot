const { z } = require('zod');
const prisma = require('../config/prisma');

const declaration = {
  name: 'get_study_materials',
  description: 'Retrieves the list of study materials uploaded by the authenticated user.',
  parameters: {
    type: 'OBJECT',
    properties: {
      status: { 
        type: 'STRING', 
        description: 'Filter by processing status: PROCESSING, READY, or FAILED.',
        enum: ['PROCESSING', 'READY', 'FAILED']
      },
      limit: { 
        type: 'INTEGER', 
        description: 'Maximum number of materials to return (1-50). Default is 50.' 
      }
    }
  }
};

const schema = z.object({
  status: z.enum(['PROCESSING', 'READY', 'FAILED']).optional(),
  limit: z.number().int().min(1).max(50).default(50).optional()
});

async function handler(args, context) {
  const { status, limit } = args;

  const whereClause = { userId: context.id };
  if (status) whereClause.status = status;

  const materials = await prisma.studyMaterial.findMany({
    where: whereClause,
    take: limit || 50,
    select: {
      id: true,
      originalFilename: true,
      fileType: true,
      fileSize: true,
      processingStatus: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return { materials };
}

module.exports = { declaration, schema, handler };
