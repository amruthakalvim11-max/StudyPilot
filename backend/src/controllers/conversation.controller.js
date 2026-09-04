const Conversation = require('../models/Conversation');

// POST /api/conversations
exports.createConversation = async (req, res) => {
  try {
    const { userId, title, initialMessage } = req.body;
    
    if (!userId || !title) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'userId and title are required' }});
    }

    const messages = initialMessage ? [initialMessage] : [];

    const conversation = new Conversation({
      userId,
      title,
      messages
    });

    await conversation.save();
    res.status(201).json({ success: true, data: conversation });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message }});
  }
};

// GET /api/conversations
exports.getConversations = async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = userId ? { userId } : {};
    
    const conversations = await Conversation.find(filter).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message }});
  }
};

// GET /api/conversations/:id
exports.getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found' }});
    }
    res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    // If id is not a valid ObjectId, it will throw a CastError
    if (error.name === 'CastError') {
       return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid conversation ID format' }});
    }
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message }});
  }
};

// PATCH /api/conversations/:id
exports.updateConversation = async (req, res) => {
  try {
    const { newMessage } = req.body;
    
    if (!newMessage || !newMessage.role || !newMessage.content) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Valid newMessage (role, content) is required' }});
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found' }});
    }

    conversation.messages.push(newMessage);
    await conversation.save();

    res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    if (error.name === 'CastError') {
       return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid conversation ID format' }});
    }
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message }});
  }
};

// DELETE /api/conversations/:id
exports.deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndDelete(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found' }});
    }
    res.status(200).json({ success: true, data: { message: 'Conversation deleted successfully' }});
  } catch (error) {
    if (error.name === 'CastError') {
       return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid conversation ID format' }});
    }
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message }});
  }
};
