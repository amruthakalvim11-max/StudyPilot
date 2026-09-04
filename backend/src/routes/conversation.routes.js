const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversation.controller');

router.post('/', conversationController.createConversation);
router.get('/', conversationController.getConversations);
router.get('/:id', conversationController.getConversationById);
router.patch('/:id', conversationController.updateConversation);
router.delete('/:id', conversationController.deleteConversation);

module.exports = router;
