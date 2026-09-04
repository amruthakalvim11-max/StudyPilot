const { z } = require('zod');

// Authentication Schemas
const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  })
});

const aiAskSchema = z.object({
  body: z.object({
    prompt: z.string().min(2, 'Prompt must be at least 2 characters').max(2000, 'Prompt is too long (max 2000 chars)')
  })
});

const courseSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Course name is required'),
    description: z.string().optional(),
    // userId is no longer accepted from body; we use req.user.id
  })
});

const assignmentSchema = z.object({
  body: z.object({
    courseId: z.string().uuid('Valid courseId is required'),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    deadline: z.string().datetime('Valid ISO datetime string is required'),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  })
});

const taskSchema = z.object({
  body: z.object({
    assignmentId: z.string().uuid().optional().nullable(),
    title: z.string().min(1, 'Title is required'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).optional(),
    dueDate: z.string().datetime().optional().nullable(),
  })
});

module.exports = {
  registerSchema,
  loginSchema,
  aiAskSchema,
  courseSchema,
  assignmentSchema,
  taskSchema
};
