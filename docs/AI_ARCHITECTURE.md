# AI Architecture (Phase 3A: AI Foundation)

## 1. Provider Choice
StudyPilot utilizes **Google Gemini** (`gemini-2.5-flash`) via the official `@google/genai` Node.js SDK. Gemini provides excellent reasoning capabilities necessary for an educational Tutor and offers first-class support for strict structured JSON outputs.

## 2. API Key Management
The `GEMINI_API_KEY` is strictly managed via `.env` files. It is never exposed to the frontend repository or stored in Git.

## 3. Centralized AI Service
All communication with the LLM routes through a single service file: `backend/src/services/ai.service.js`. 
This guarantees that:
- Prompts are strictly controlled and engineered server-side.
- Internal System Instructions cannot be modified or bypassed by a malicious frontend user.

## 4. Prompt Engineering
We employ a **System Instruction** model where the "StudyPilot Tutor" persona is explicitly defined. The system prompt instructs the AI to *never* output raw answers or complete assignments on behalf of the student, but instead provide structured guidance.
The user's individual context (`name`, `role`) is dynamically injected into each request context so the Tutor can personalize its advice.

## 5. Structured Outputs
Instead of relying on fragile string parsing, we configure the `responseMimeType: 'application/json'` and explicitly pass a `responseSchema` (schema definition) to the Gemini model. This guarantees the LLM returns an exact JSON shape with required keys: `response`, `suggestions` (an array), and `encouragement`.

## 6. Security and Abuse Prevention
- The `/api/ai/ask` route is protected by `authMiddleware`, so anonymous users cannot burn our API credits.
- An aggressive Rate Limiter (20 requests per 15 minutes per user) is enforced via Redis on the AI routes.
- Zod is used to validate the incoming user prompt to ensure it is not too short or excessively long (max 2000 characters).

## 7. Testing & Mocking
To execute automated test pipelines securely and cost-effectively, `ai.service.js` supports a `useMock` flag. When triggered (via `X-Test-Mock-AI` header), the service bypasses the network call to Google and returns a static JSON payload matching the expected output schema. This allows us to test our authentication, rate limiting, and Zod validation layers independently of the LLM provider.
