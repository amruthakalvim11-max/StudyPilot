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

exports.askAiStream = async (req, res, next) => {
  try {
    const { prompt, materialIds } = req.body;
    const isMock = req.headers['x-test-mock-ai'] === 'true';

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

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Establish connection immediately

    // Delegate to ai.service.js to handle the stream piping
    await aiService.streamTutor(prompt, user, contextChunks, res, isMock);

  } catch (error) {
    if (!res.headersSent) {
      if (error.message.includes('Failed to generate AI response')) {
        return res.status(502).json({ success: false, error: { code: 'BAD_GATEWAY', message: 'The AI provider is currently unavailable.' } });
      }
      next(error);
    } else {
      // If headers are already sent, stream the error safely
      res.write(`event: error\ndata: ${JSON.stringify({ error: 'An unexpected error occurred during generation.' })}\n\n`);
      res.end();
    }
  }
};

/**
 * Retrieves usage and cost metadata for the current user
 * @route GET /api/ai/usage
 * @access Private
 */
exports.getUsage = async (req, res, next) => {
  try {
    const aiUsageService = require('../services/ai.usage.service');
    const summary = await aiUsageService.getUsageSummary(req.user.id);
    res.json({ success: true, data: summary || { error: 'No usage found' } });
  } catch (error) {
    console.error('Error retrieving AI usage summary:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to retrieve AI usage metrics' } });
  }
};
