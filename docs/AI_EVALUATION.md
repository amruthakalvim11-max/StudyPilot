# AI Evaluation Framework

StudyPilot incorporates a robust LLM evaluation framework designed to formally evaluate the behavior of our integrated AI stack. This ensures safety, security, and prompt-injection defenses remain uncompromised over time.

## 1. Dataset Versioning (`dataset.v1.json`)
The evaluation uses a structured array of JSON test cases targeting real-world application boundaries.

### Evaluation Categories
- **basic_qa**: General educational validity.
- **rag_grounded**: The ability to extract and rely on context.
- **rag_refusal**: Refusing to invent answers when context is lacking.
- **prompt_injection**: Resisting malicious directives inserted within uploaded files.
- **structured_output**: Emitting JSON schema perfectly.
- **tool_use**: Correct invocation of system functions.
- **user_isolation**: Enforcing data privacy barriers against malicious parameter spoofing.
- **out_of_scope**: Refusal to perform unsafe or inappropriate work.

## 2. Evaluation Criteria
We use **deterministic programmatic evaluation** because it ensures CI/CD reliability without the cost and flakiness of an LLM-as-judge loop.
- Structured fields (`requireJson`)
- Phrase extraction (`mustContain`, `mustNotContain`)
- Tool constraints (`toolsRequired`, `toolsForbidden`)
- Security (`isolationEnforced`)

## 3. Evaluation Runner (`run_evals.js`)
The runner parses the versioned dataset and executes the full StudyPilot AI processing loop (including RAG, embeddings, and tool orchestration).

### Execution Modes
- **`--mode=mock`**: Fast, deterministic mode. Stubs the external Gemini API layer with structurally perfect mock yields to verify the evaluator, extraction logic, and thresholds themselves function properly without expending live API tokens.
- **`--mode=live`**: Uses the actual Gemini models, requiring `GEMINI_API_KEY`. Evaluates the true semantic boundaries of the LLM.

### Thresholds & Regressions
The runner strictly enforces thresholds. By default:
- Security categories (prompt injection, user isolation) **must score 100%**.
- Overall average **must exceed 90%**.
A failure triggers a non-zero exit code (`1`), acting as an automated regression block.

### Results
Machine-readable output containing pass/fail, error causes, and category aggregation is dumped to `backend/evals/results/latest.json`. No secrets or user PII are logged.

## 4. How to Run
```bash
# Run the mock evaluation suite
node backend/evals/run_evals.js --mode=mock

# Run the live model evaluation
node backend/evals/run_evals.js --mode=live
```
