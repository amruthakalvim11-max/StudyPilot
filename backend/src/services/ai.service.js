const agentService = require('./agent.service');

/**
 * Asks the AI Tutor a question and expects a structured JSON response.
 * Delegated to the Agent Service (Phase 3D) to handle complex multi-step orchestration.
 * @param {string} prompt - The user's input/question.
 * @param {object} context - User context (name, role, id).
 * @param {Array} contextChunks - Retrieved RAG chunks.
 * @param {boolean} useMock - Force mock response.
 */
exports.askTutor = async (prompt, context, contextChunks = [], useMock = false) => {
  return await agentService.runAgent(prompt, context, contextChunks, useMock);
};
