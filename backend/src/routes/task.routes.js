const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const validateRequest = require('../middleware/validateRequest');
const { taskSchema } = require('../validators/schemas');

router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', validateRequest(taskSchema), taskController.createTask);
router.patch('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
