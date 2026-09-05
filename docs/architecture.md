# StudyPilot - Architecture Overview

StudyPilot adopts a modern, decoupled 3-tier architecture with a polyglot persistence layer.

## 1. Presentation Layer (Frontend)
- **Framework:** React with Vite for fast bundling.
- **Routing:** React Router for client-side navigation, ensuring a seamless Single Page Application (SPA) experience.
- **Styling:** Tailwind CSS for a utility-first, responsive design system.
- **Data Fetching:** Standard `fetch` API or Axios to communicate asynchronously with the backend.

## 2. Application Layer (Backend)
- **Runtime & Framework:** Node.js with Express.
- **Architecture Pattern:** The StudyPilot backend follows a standard monolithic Node.js/Express architecture with a focus on separation of concerns.

## Core Components

1.  **Controllers (`src/controllers/`)**: Handle incoming HTTP requests, input validation, and send responses. They act as the entry point for API routes.
2.  **Services (`src/services/`)**: Contain the core business logic. Controllers delegate complex operations to services (e.g., `ai.service.js`, `rag.service.js`, `cache.service.js`).
3.  **Data Access (`src/config/prisma.js`)**: Prisma ORM is used to interact with the PostgreSQL database.
4.  **Security (`src/middleware/`)**: Middlewares handle JWT authentication (`authMiddleware.js`), request validation (`validateRequest.js`), and rate limiting.
5.  **Caching (`src/services/cache.service.js`)**: Redis is employed in a Cache-Aside pattern to reduce PostgreSQL load for high-traffic read operations (see [REDIS_CACHING.md](./REDIS_CACHING.md)).
  - `errorHandlerMiddleware`: Centralized error catching to ensure consistent error response formats.
  - `loggerMiddleware`: Logs incoming requests for debugging.

## 3. Data Layer (Databases)
StudyPilot uses two databases to best fit the shape of the data:
- **PostgreSQL (via Prisma ORM):**
  - **Why:** Highly structured data with strong relationships (User -> Course -> Assignment -> Task).
  - **Features:** Enforces referential integrity (PK/FK), allows complex JOINs for dashboard aggregation.
- **MongoDB (via Mongoose):**
  - **Why:** AI conversations consist of unstructured or highly variable nested message arrays.
  - **Features:** Flexible schema modeling, easy appending to message arrays.

## 4. AI Integration Layer
- **External LLM Service:** The backend acts as a proxy to the LLM API to protect API keys (Environment Variables).
- **Prompt Engineering:** The backend constructs detailed prompts using user inputs.
- **Structured Outputs:** The backend instructs the LLM to return strictly formatted JSON, which is then parsed and validated before being sent to the frontend.

## System Design Considerations
- **Separation of Concerns:** Clear boundaries between frontend UI, backend logic, and database access.
- **Security:** Passwords hashed with bcrypt, API endpoints protected by JWT, secrets stored in `.env`.
- **Scalability:** Stateless backend design (JWT instead of sessions) allows the Node.js server to be scaled horizontally if needed.
