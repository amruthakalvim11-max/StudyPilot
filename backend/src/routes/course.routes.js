const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const validateRequest = require('../middleware/validateRequest');
const { courseSchema } = require('../validators/schemas');

router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourseById);
router.post('/', validateRequest(courseSchema), courseController.createCourse);
router.patch('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);

module.exports = router;
