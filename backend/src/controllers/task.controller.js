const prisma = require('../config/prisma');

exports.getTasks = async (req, res, next) => {
  try {
    const { status, priority, sortBy, order } = req.query;
    
    // Filtering with mandatory ownership check
    const where = { userId: req.user.id };
    if (status) where.status = status;
    if (priority) where.priority = priority;

    // Ordering (Whitelisting fields)
    const allowedSortFields = ['priority', 'createdAt', 'dueDate'];
    let orderBy = { createdAt: 'desc' };
    
    if (sortBy && allowedSortFields.includes(sortBy)) {
      const sortOrder = (order === 'asc' || order === 'desc') ? order : 'asc';
      orderBy = { [sortBy]: sortOrder };
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy,
      include: { 
        assignment: { select: { title: true } },
        user: { select: { name: true, email: true } }
      }
    });
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

exports.getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: { assignment: true }
    });

    if (!task || task.userId !== req.user.id) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } });
    }
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const { assignmentId, title, priority, status, dueDate } = req.body;
    
    // Verify assignment belongs to user if provided
    if (assignmentId) {
      const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId }, include: { course: true } });
      if (!assignment || assignment.course.userId !== req.user.id) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found' } });
      }
    }

    const task = await prisma.task.create({
      data: { 
        userId: req.user.id, 
        assignmentId, 
        title, 
        priority, 
        status, 
        dueDate: dueDate ? new Date(dueDate) : null 
      }
    });
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } });
    }

    const { title, priority, status, dueDate } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (priority !== undefined) data.priority = priority;
    if (status !== undefined) data.status = status;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;

    const task = await prisma.task.update({
      where: { id },
      data
    });
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } });
    }

    await prisma.task.delete({ where: { id } });
    res.json({ success: true, data: { message: 'Task deleted successfully' } });
  } catch (error) {
    next(error);
  }
};
