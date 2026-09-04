const prisma = require('../config/prisma');

exports.getAssignments = async (req, res, next) => {
  try {
    const { status, courseId } = req.query;
    
    // Filtering implementation + Ownership check via course relation
    const where = {
      course: { userId: req.user.id }
    };
    if (status) where.status = status;
    if (courseId) where.courseId = courseId;

    const assignments = await prisma.assignment.findMany({
      where,
      orderBy: { deadline: 'asc' },
      include: { course: { select: { name: true } } }
    });
    res.json({ success: true, data: assignments });
  } catch (error) {
    next(error);
  }
};

exports.getAssignmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: { course: true, tasks: true }
    });

    if (!assignment || assignment.course.userId !== req.user.id) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found' } });
    }
    res.json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

exports.createAssignment = async (req, res, next) => {
  try {
    const { courseId, title, description, deadline, status } = req.body;
    
    // Check if course exists and belongs to user
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.userId !== req.user.id) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } });
    }

    const assignment = await prisma.assignment.create({
      data: { courseId, title, description, deadline: new Date(deadline), status }
    });
    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

exports.updateAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Ownership check
    const existing = await prisma.assignment.findUnique({ where: { id }, include: { course: true } });
    if (!existing || existing.course.userId !== req.user.id) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found' } });
    }

    const { title, description, deadline, status } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (deadline !== undefined) data.deadline = new Date(deadline);
    if (status !== undefined) data.status = status;

    const assignment = await prisma.assignment.update({
      where: { id },
      data
    });
    res.json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

exports.deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.assignment.findUnique({ where: { id }, include: { course: true } });
    if (!existing || existing.course.userId !== req.user.id) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found' } });
    }

    await prisma.assignment.delete({ where: { id } });
    res.json({ success: true, data: { message: 'Assignment deleted successfully' } });
  } catch (error) {
    next(error);
  }
};

exports.createAssignmentAndTaskTx = async (req, res, next) => {
  try {
    const { courseId, title, description, deadline, initialTaskTitle } = req.body;
    
    if (!initialTaskTitle) {
       return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'initialTaskTitle is required' } });
    }

    // Interactive Transaction with Ownership check
    const result = await prisma.$transaction(async (tx) => {
      const course = await tx.course.findUnique({ where: { id: courseId } });
      if (!course || course.userId !== req.user.id) {
        throw new Error('NOT_FOUND');
      }

      const assignment = await tx.assignment.create({
        data: { courseId, title, description, deadline: new Date(deadline) }
      });

      const task = await tx.task.create({
        data: {
          title: initialTaskTitle,
          userId: req.user.id,
          assignmentId: assignment.id,
          dueDate: new Date(deadline),
          priority: 'HIGH',
          status: 'TODO'
        }
      });

      return { assignment, task };
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } });
    }
    next(error);
  }
};
