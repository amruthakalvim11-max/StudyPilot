# AI Usage & Cost Monitoring

StudyPilot tracks and estimates the cost of all AI interactions using a centralized monitoring layer to prevent unmetered spending.

## What is Measured?

The `ai.usage.service.js` records explicit metadata from the `@google/genai` API SDK:
- `promptTokenCount` (Input tokens)
- `candidatesTokenCount` (Output tokens)
- `totalTokenCount` (Total tokens)
- `cachedContentTokenCount` (Cached input tokens)

## Where Usage Metadata Comes From

Token counts are extracted **exclusively** from the actual `usageMetadata` object provided by the Gemini API response.
**If `usageMetadata` is omitted by the API (e.g. sometimes in streaming), the usage tokens and cost are recorded as `null`.** The system *never* fabricates token estimates based on character count or approximations.

## Pricing Configuration
Pricing is decoupled from code and located in `backend/src/config/ai-pricing.js`.
It maps a model string to official price structures (e.g. $0.075 / 1M input tokens for `gemini-2.5-flash`). Update this file whenever Google announces pricing changes.

## Operation Categories
Each request is tagged with an `AiUsageOperation`:
- `TUTOR`: Standard synchronous AI responses.
- `RAG`: Responses utilizing vector-embedded knowledge bases.
- `FUNCTION_CALL`: Single-step queries utilizing a specific tool.
- `AGENT`: Autonomous multi-step iterations.
- `STREAM`: Server-Sent Event (SSE) responses.

## Agent Aggregation
Agentic workflows frequently trigger multiple nested AI requests. StudyPilot monitors **each individual atomic API call**. The `getUsageSummary` safely groups these atomic records by operation, completely preventing double-counting while preserving exactly how many tokens were expended by the background processing logic.

## Streaming Limitations
The Google Gemini SDK occasionally struggles to append `usageMetadata` during SSE streams or connection abortions. If a stream is aborted prior to the SDK appending the final usage payload, the usage falls back to `null`.

## Privacy & Security
The `AiUsage` Prisma table only associates aggregate telemetry mapped to a standard internal `userId`. **Prompts, responses, and API Keys are completely excluded from these logging systems.**

## Testing
To verify token extraction logic, agent aggregation, and pricing mathematics:
```bash
node test_ai_usage.js
```
