# StudyPilot - Architecture Overview

StudyPilot adopts a modern, decoupled 3-tier architecture with a polyglot persistence layer.

## 1. Presentation Layer (Frontend)
- **Framework:** React with Vite for fast bundling.
- **Routing:** React Router for client-side navigation, ensuring a seamless Single Page Application (SPA) experience.
- **Styling:** Tailwind CSS for a utility-first, responsive design system.
- **Data Fetching:** Standard `fetch` API or Axios to communicate asynchronously with the backend.

## 2. Application Layer (Backend)
- **Runtime & Framework:** Node.js with Express.
- **Architecture Pattern:** MVC-inspired (Routes -> Controllers -> Services).
  - **Routes:** Define the API endpoints and map them to controllers.
  - **Controllers:** Handle HTTP requests, extract parameters, and return HTTP responses (status codes & JSON).
  - **Services:** Contain the core business logic, database interactions, and external API calls.
- **Middleware:** 
  - `authMiddleware`: Verifies JWT tokens.
  - `validationMiddleware`: Validates incoming request payloads.
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
