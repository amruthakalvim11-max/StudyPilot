# Rubric Mapping

This document maps the project rubric requirements to their specific implementations in the StudyPilot codebase.

| Rubric item | Implementation | File/Location | How to demonstrate |
|-------------|----------------|---------------|--------------------|
| **LLM API integration** | [PASS] Call LLM API using environment variables | `backend/src/services/ai.service.js` | Show the API call in code and AI responses in UI |
| **Prompt engineering** | [PASS] Construct engineered prompts for Tutor and Planner | `backend/src/services/ai.service.js` | Show the prompt templates in code |
| **RAG - embeddings & vector retrieval** | [PASS] Use pgvector for storing and retrieving document vectors via raw cosine distance SQL. Ownership strictly enforced. | `backend/src/services/rag.service.js` | Run the Vector Search tests |
| **Structured outputs** | [PASS] Request JSON format from LLM and parse | `backend/src/services/ai.service.js` | Show the JSON schema in prompt and the parsed result |
| **File upload handling** | [PASS] Store files via `multer` securely, validate MIME type and 10MB limit | `backend/src/routes/material.routes.js` | Show the upload test or code |
| **HTTP status codes used correctly** | [PASS] Return 200, 201, 400, 401, 403, 404, 409, 429, 500 | `backend/src/controllers/auth.controller.js` | Automated API tests output |
| **Middleware** | [PASS] Zod validation, JWT verification, RBAC | `backend/src/middleware/authMiddleware.js`, `errorHandler.js` | Send invalid POST request to trigger 400 or missing token for 401 |
| **Problem modeling** | [PASS] ERD design and DB documentation | `docs/DATABASE_DESIGN.md` | Show documentation |
| **RESTful endpoint design** | [PASS] Resource-based URLs, appropriate HTTP methods | `backend/src/routes/*.js` | Show API routes (`GET /api/courses`, etc.) |
| **Server-side error handling** | [PASS] Centralized error handler, consistent JSON format | `backend/src/middleware/errorHandler.js` | Trigger a server error and check JSON |
| **System design basics** | [PASS] Separation of concerns (Controller-Service-Prisma) | `backend/src/controllers/*.js` | Review controller files |
| **Environment variables & secrets management** | [PASS] `.env` file, JWT Secrets, DB URLs | `backend/.env.example` | Show `.env.example` |
| **Git workflow** | Feature branches (`feature/auth`, etc.) | Git history | Run `git log --graph --oneline` |
| **Async data fetching from API** | [PASS] `axios` used to fetch data with interceptors | `frontend/src/services/api.js` | Browser network tab |
| **Client-side routing** | [PASS] React Router (`react-router-dom`) | `frontend/src/App.jsx` | Navigate between pages |
| **JavaScript async/await** | [PASS] Async DB queries and API calls | `backend/src/controllers/task.controller.js` | Review `async`/`await` usage |
| **JavaScript closures** | Functions returning functions, state capture | `docs/javascript-concepts.md` & code snippets | Show closure example in code |
| **JavaScript event loop** | Non-blocking I/O handling | `docs/javascript-concepts.md` | Show concurrent async operations |
| **JavaScript hoisting** | Variable/function declarations | `docs/javascript-concepts.md` | Explain hoisting in context of the app |
| **JavaScript promises vs callbacks** | Promise chains vs callback pyramids | `docs/javascript-concepts.md` | Show Promise usage |
| **React component composition** | [PASS] Building complex UIs from components | `frontend/src/pages/Dashboard.jsx` | Show `StatsCard` usage |
| **useEffect** | [PASS] Fetching data on mount | `frontend/src/pages/Tasks.jsx` | Check `useEffect` hooks fetching data |
| **useState** | [PASS] Managing loading, error, and data state | `frontend/src/pages/Assignments.jsx` | Check state management |
| **Mongo CRUD** | [PASS] Conversation CRUD operations | `backend/src/controllers/conversation.controller.js`| Automated tests / Postman |
| **Mongo schema modeling** | [PASS] Flexible message arrays | `backend/src/models/Conversation.js` | Review Mongoose schema |
| **PostgreSQL PK/FK schema design** | [PASS] Relational tables with strict constraints | `backend/prisma/schema.prisma` | Review Prisma schema relations |
| **SQL JOINs** | [PASS] Fetching relational user/course/assignment data | `backend/src/controllers/dashboard.controller.js` | Review Prisma `include` nested queries |
| **Filtering, ordering, grouping** | [PASS] Prisma `where`, `orderBy`, `groupBy` used | `backend/src/controllers/task.controller.js`, `dashboard` | View `GET /api/tasks?priority=HIGH` and `groupBy` code |
| **Indexing for query performance** | [PASS] Custom indexes on foreign keys & status/dates | `backend/prisma/schema.prisma` | Review `@@index` annotations |
| **Normalization basics** | [PASS] No redundant data (3NF) | `docs/DATABASE_DESIGN.md` | Show lack of data duplication in schema |
| **ORM usage — Prisma** | [PASS] Type-safe database queries | `backend/src/controllers/course.controller.js` | Show Prisma method calls |
| **Transactions** | [PASS] Prisma interactive transactions | `backend/src/controllers/assignment.controller.js` | Check `createAssignmentAndTaskTx` method |
| **Request body validation** | [PASS] Zod schemas integrated | `backend/src/validators/schemas.js` | POST invalid data to API |
| **Automated API/integration tests** | [PASS] Fetch-based API testers | `backend/test_auth.js` | Run the test scripts |
| **Password hashing** | [PASS] Passwords hashed with bcryptjs | `backend/src/controllers/auth.controller.js` | Check controller registration logic |
| **JWT issuance and verification** | [PASS] JWT generated on login, verified by authMiddleware | `backend/src/middleware/authMiddleware.js` | Check token issuance/verification |
| **OAuth / third-party login** | [PASS] Google OAuth implementation | `backend/src/controllers/auth.controller.js` | Check googleLogin endpoint implementation |
| **Rate limiting** | [PASS] Redis rate-limiting applied to auth routes | `backend/src/routes/auth.routes.js` | Hit login endpoint 10+ times to trigger 429 |
| **Function calling / tool use** | [PASS] Centralized tool registry executes secure backend functions with strict isolation and loops up to MAX_TOOL_ROUNDS=5. | `backend/src/tools/index.js` | Run `test_tools.js` |
| **Multi-step autonomous agent** | [PASS] Agent securely plans and executes sequential, stateful tool chains up to MAX_AGENT_STEPS=8. | `backend/src/services/agent.service.js` | Run `test_agent.js` |
| **Role-based authorization** | [PASS] RBAC middleware implemented | `backend/src/middleware/roleMiddleware.js` | Review requireRole middleware |
| **Input sanitization and injection awareness** | [PASS] Zod schemas, Prisma param queries | `docs/SECURITY.md` | See SECURITY documentation |
