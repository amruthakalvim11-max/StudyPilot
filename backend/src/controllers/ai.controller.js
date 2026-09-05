const aiService = require('../services/ai.service');
const ragService = require('../services/rag.service');
const prisma = require('../config/prisma');

exports.askAi = async (req, res, next) => {
  try {
    const { prompt, materialIds } = req.body;
    
    // Check if test header is present to use mock mode
    const isMock = req.headers['x-test-mock-ai'] === 'true';

    // Retrieve user context to pass to the LLM
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true, role: true }
    });

    let contextChunks = [];
    if (materialIds && materialIds.length > 0) {
      contextChunks = await ragService.retrieveRelevantChunks({
        userId: req.user.id,
        query: prompt,
        materialIds,
        useMock: isMock
      });
    }

    const result = await aiService.askTutor(prompt, user, contextChunks, isMock);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error.message.includes('Failed to generate AI response')) {
      return res.status(502).json({ success: false, error: { code: 'BAD_GATEWAY', message: 'The AI provider is currently unavailable.' } });
    }
    next(error);
  }
};
