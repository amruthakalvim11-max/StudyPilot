# AI Streaming (Phase 3E)

StudyPilot implements genuine AI streaming utilizing Server-Sent Events (SSE) and the `@google/genai` streaming API.

## Architecture & SSE Implementation

### 1. Endpoint
**`POST /api/ai/ask/stream`**
- Requires JWT Authentication.
- Enforces the same strict rate-limiting rules (20 requests / 15 min) as the non-streaming AI endpoint.
- Accepts `prompt` and optional `materialIds` (for RAG).

### 2. Stream Data Format (Server-Sent Events)
The backend leverages the `generateContentStream` method. As chunks arrive from Gemini, they are forwarded natively to the client.

- **Chunk Event**: Emitted as fragments are received.
  ```text
  event: chunk
  data: {"text":"... JSON string fragment ..."}
  ```
- **Done Event**: Emitted after the stream closes, containing the strictly validated `FINAL_RESPONSE_SCHEMA` JSON object so the UI can render structured suggestions.
  ```text
  event: done
  data: {"response":"...","suggestions":["..."],"encouragement":"...","toolsUsed":[]}
  ```
- **Error Event**: Safely aborts the stream without leaking secrets.
  ```text
  event: error
  data: {"error":"An unexpected error occurred."}
  ```

### 3. Frontend Consumption
The React `AITutor.jsx` frontend utilizes `fetch` with `response.body.getReader()`. It parses the SSE format incrementally, extracting the raw string response on-the-fly and updating state iteratively. It also supports `AbortController` cancellation, immediately ending backend stream aggregation if the user leaves.

## Limitations & Agent Compatibility (Option B)
To ensure safety and reliability for complex autonomous tasks (Phase 3D), the Multi-Step Agent loop remains **non-streaming** on `/api/ai/ask`. 
The new `/api/ai/ask/stream` endpoint is optimized strictly for direct Conversational & RAG interactions (Option B architecture), ensuring the safest possible UX without compromising advanced Agent functionality.
