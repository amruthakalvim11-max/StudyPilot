const { GoogleGenAI } = require('@google/genai');

let ai;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

/**
 * Generates an embedding for the given text.
 * @param {string} text - The text to embed.
 * @param {boolean} useMock - Whether to mock the response for testing.
 * @returns {Promise<Array<number>>} The vector embedding.
 */
exports.generateEmbedding = async (text, useMock = false) => {
  if (useMock || !process.env.GEMINI_API_KEY) {
    // Return a mocked 768-dimensional vector (Gemini's text-embedding-004 dimension)
    return Array(768).fill(0).map(() => Math.random());
  }

  try {
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: text
    });
    
    // The SDK returns an array of embeddings (even if we provided single content)
    // We get the first one's values
    if (response.embeddings && response.embeddings.length > 0) {
      return response.embeddings[0].values;
    }
    
    throw new Error('No embeddings returned from provider');
  } catch (error) {
    console.error('Embedding Generation Error:', error);
    throw new Error('Failed to generate embedding');
  }
};
