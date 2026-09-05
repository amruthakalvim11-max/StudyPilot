const prisma = require('../config/prisma');
const cacheService = require('../services/cache.service');

exports.getCourses = async (req, res, next) => {
  try {
    const cacheKey = cacheService.generateUserKey('courses', req.user.id);
    
    const courses = await cacheService.cacheAside(cacheKey, 60, async () => {
      return await prisma.course.findMany({
        where: { userId: req.user.id }, // Ownership check
        orderBy: { createdAt: 'desc' }
      });
    });
    
    res.json({ success: true, data: courses });
  } catch (error) {
    next(error);
  }
};

exports.getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: { assignments: true }
    });

    if (!course || course.userId !== req.user.id) { // Ownership check
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } });
    }

    res.json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

exports.createCourse = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const course = await prisma.course.create({
      data: { name, description, userId: req.user.id } // Force userId from JWT
    });
    
    // Invalidate Cache
    await cacheService.delete(cacheService.generateUserKey('courses', req.user.id));
    
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check ownership before updating
    const existingCourse = await prisma.course.findUnique({ where: { id } });
    if (!existingCourse || existingCourse.userId !== req.user.id) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } });
    }

    const { name, description } = req.body;
    const course = await prisma.course.update({
      where: { id },
      data: { name, description }
    });
    
    // Invalidate Cache
    await cacheService.delete(cacheService.generateUserKey('courses', req.user.id));
    
    res.json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check ownership before deleting
    const existingCourse = await prisma.course.findUnique({ where: { id } });
    if (!existingCourse || existingCourse.userId !== req.user.id) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } });
    }

    await prisma.course.delete({ where: { id } });
    
    // Invalidate Cache
    await cacheService.delete(cacheService.generateUserKey('courses', req.user.id));
    
    res.json({ success: true, data: { message: 'Course deleted successfully' } });
  } catch (error) {
    next(error);
  }
};
