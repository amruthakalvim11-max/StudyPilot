const { GoogleGenAI } = require('@google/genai');

let ai;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
} else {
  console.warn('GEMINI_API_KEY is not set. AI Service will operate in Mock Mode.');
}

const SYSTEM_PROMPT = `You are the StudyPilot AI Tutor, an educational assistant.
Your goal is to help students plan their academic tasks and explain concepts.
Do NOT complete assignments or write code for them.
Instead, guide them with hints, step-by-step reasoning, and structured advice.

Respond ONLY in the exact JSON format specified by the user. Do not include markdown formatting or backticks outside of what is required by JSON.
`;

/**
 * Asks the AI Tutor a question and expects a structured JSON response.
 * @param {string} prompt - The user's input/question.
 * @param {object} context - User context (name, role).
 * @param {boolean} useMock - Force mock response (used for automated tests to save API costs).
 */
exports.askTutor = async (prompt, context, useMock = false) => {
  if (useMock || !process.env.GEMINI_API_KEY) {
    // Return a mocked response for tests or missing credentials
    return {
      response: `[MOCK] I see you are asking: "${prompt}". Here is your structured advice.`,
      suggestions: ['Break down your task into smaller steps.', 'Review your notes from class.'],
      encouragement: `Keep up the good work, ${context.name || 'Student'}!`
    };
  }

  const model = 'gemini-2.5-flash';
  const fullPrompt = `Context: User Name: ${context.name}, Role: ${context.role}\n\nUser Question: ${prompt}`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            response: { type: 'STRING', description: 'The main textual response or explanation to the user.' },
            suggestions: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'A list of 2-3 actionable suggestions or hints.'
            },
            encouragement: { type: 'STRING', description: 'A short encouraging closing statement.' }
          },
          required: ['response', 'suggestions', 'encouragement']
        }
      }
    });

    const outputText = response.text;
    const parsedData = JSON.parse(outputText);
    return parsedData;

  } catch (error) {
    console.error('AI Service Error:', error);
    throw new Error('Failed to generate AI response: ' + error.message);
  }
};
