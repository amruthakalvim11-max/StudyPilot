const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignment.controller');
const validateRequest = require('../middleware/validateRequest');
const { assignmentSchema } = require('../validators/schemas');

router.get('/', assignmentController.getAssignments);
router.get('/:id', assignmentController.getAssignmentById);
router.post('/', validateRequest(assignmentSchema), assignmentController.createAssignment);
router.post('/with-task', assignmentController.createAssignmentAndTaskTx); // Transaction endpoint
router.patch('/:id', assignmentController.updateAssignment);
router.delete('/:id', assignmentController.deleteAssignment);

module.exports = router;
