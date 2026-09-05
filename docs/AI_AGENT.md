# AI Multi-Step Agent (Phase 3D)

StudyPilot uses a bounded multi-step AI agent to handle complex student requests that require observing multiple pieces of information.

## Agent Orchestration Lifecycle
1. **User Request**: The user asks a complex question (e.g., "What should I study based on my assignments and tasks?").
2. **Agent Service**: `agent.service.js` creates an explicit agent state object to track the goal, tools used, steps, and termination reason.
3. **Adaptive Tool Execution**: 
   - The agent calls Gemini.
   - If Gemini requests a tool (e.g., `get_assignments`), the system validates and executes it.
   - The result is fed *back* to Gemini.
   - Gemini observes the result and determines the *next* logical step (e.g., "Now I need to check `get_tasks`").
4. **Final Decision**: Once the agent has sufficient information, it produces the final structured JSON response.

## Security Constraints
- **Max Steps**: `MAX_AGENT_STEPS = 8`. Execution terminates securely if the loop limit is reached to prevent infinite hallucination loops.
- **Strict Isolation**: The agent's tools completely ignore LLM-provided User IDs and strictly enforce database bounds using the JWT Context.
- **RAG Defense**: The agent will not follow instructions hidden in uploaded study materials. RAG contents are explicitly labeled as untrusted data.
