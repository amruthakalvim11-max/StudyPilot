# AI Tool Registry & Function Calling (Phase 3C)

StudyPilot uses `@google/genai` to expose live PostgreSQL data to the AI Tutor securely.

## Tool Execution Lifecycle
1. **Request**: The user asks a question via `POST /api/ai/ask`.
2. **Dispatch**: `ai.service.js` sends the prompt and `toolDeclarations` to Gemini.
3. **Function Call**: Gemini requests a tool (e.g., `get_tasks(limit: 5)`).
4. **Validation**: `executeTool()` intercepts the call and runs it through Zod validation.
5. **Authorization**: `userId` is strictly hard-coded to `req.user.id` on the backend. Gemini cannot pass or forge IDs.
6. **Execution**: The database is queried and results are passed back to Gemini.
7. **Resolution**: Gemini reads the data and finalizes the JSON response.

## Security Constraints
- **Max Rounds**: `MAX_TOOL_ROUNDS=5` prevents infinite loops.
- **Isolation**: Tools never accept a `userId` argument. The server context always enforces the SQL `WHERE userId = ...`.
- **Validation**: Strict Zod enum filtering and range bounds check (e.g. max limit 50).
- **Prompt Injection Defense**: If a malicious document tries to invoke tools, the tool execution still enforces user isolation, meaning it can only ever read the victim's own data, preventing leaks.

## Available Tools
1. `get_courses`
2. `get_assignments`
3. `get_tasks`
4. `get_study_materials`
