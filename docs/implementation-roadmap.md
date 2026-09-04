# Implementation Roadmap

This roadmap outlines the step-by-step process for building StudyPilot, heavily utilizing a feature-branch Git workflow.

## Phase 1: Project Setup & Foundation
**Branch:** `setup/initial-project`
1. Initialize Git repository.
2. Setup Backend: `npm init`, install Express, Mongoose, Prisma, etc.
3. Setup Frontend: `npm create vite@latest`, install React Router, Tailwind CSS.
4. Configure `.env.example`, ESLint, and Prettier.
5. Create centralized error handling and basic middleware on the backend.

## Phase 2: Authentication System
**Branch:** `feature/auth`
1. Implement PostgreSQL User model via Prisma.
2. Create `POST /api/auth/register` and `POST /api/auth/login`.
3. Implement `authMiddleware` for JWT verification.
4. Frontend: Create Login and Register pages.
5. Frontend: Implement AuthContext and protected routes.

## Phase 3: Academic Core Features (Courses, Assignments, Tasks)
**Branches:** `feature/courses`, `feature/assignments`, `feature/tasks`
1. Define Prisma models for Course, Assignment, and Task.
2. Implement backend CRUD controllers and routes for each entity.
3. Create frontend pages and reusable components (`CourseCard`, `TaskCard`, `Modal`).
4. Implement API service calls in the frontend using `fetch` or `axios`.
5. Implement frontend state management (`useState`, `useEffect`) to display data.

## Phase 4: Dashboard & SQL JOINs
**Branch:** `feature/dashboard`
1. Create a specialized backend route to fetch aggregate data (Total courses, pending tasks, upcoming deadlines).
2. Use Prisma to demonstrate relational joins fetching Tasks along with their associated Course/Assignment data.
3. Frontend: Build the Dashboard UI with `StatsCard` components.

## Phase 5: AI Tutor Integration
**Branch:** `feature/ai-tutor`
1. Obtain LLM API Key and configure in `.env`.
2. Create `ai.service.js` in backend to handle prompt engineering and API calls.
3. Enforce and validate structured JSON outputs from the LLM.
4. Frontend: Build `AITutor.jsx` and `AIResponse`/`QuizCard` components.

## Phase 6: AI Study Planner
**Branch:** `feature/study-planner`
1. Create backend service for generating structured study plans based on parameters.
2. Frontend: Build `StudyPlanner.jsx` with a form to gather user constraints (exam date, hours available).
3. Render the structured JSON output as a readable timeline on the frontend.

## Phase 7: MongoDB & Conversation History
**Branch:** `feature/mongodb`
1. Configure Mongoose connection in the backend.
2. Create `Conversation` model with nested `messages`.
3. Implement CRUD routes for conversations.
4. Hook up the AI Tutor to save user and assistant messages into MongoDB.
5. Frontend: Build a sidebar or history page to view past conversations.

## Phase 8: Polish & Documentation
**Branch:** `chore/polish-and-docs`
1. Finalize `docs/javascript-concepts.md` with relevant code snippets from the project.
2. Review UI responsiveness, empty states, loading states, and error messages.
3. Ensure all rubric items are demonstrable and map correctly in `RUBRIC.md`.
