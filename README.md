# StudyPilot - AI-Powered Student Productivity Platform

StudyPilot is an innovative full-stack web application designed to enhance student productivity and learning through AI-powered features. It combines traditional task and course management with intelligent study planning and an interactive AI tutor.

## Architecture

The application follows a modern, decoupled client-server architecture.

- **Frontend:** A single-page application (SPA) built with React and Vite. It handles the user interface, client-side routing (React Router), state management, and async data fetching. Tailwind CSS is used for responsive and modern styling.
- **Backend:** A RESTful API built with Node.js and Express. It acts as the central hub, managing business logic, authentication, and communication with databases and external AI services.
- **Databases:** A polyglot persistence strategy is employed:
  - **PostgreSQL:** Used for structured, relational data (Users, Courses, Assignments, Tasks). Accessed via Prisma ORM.
  - **MongoDB:** Used for flexible, document-based data (AI Conversations and Message histories). Accessed via Mongoose.
- **AI Integration:** An external LLM API is utilized to provide the AI Tutor and AI Study Planner functionalities. The backend orchestrates prompt engineering and enforces structured JSON outputs from the LLM.

## Technologies Used

- **Frontend:** React, Vite, React Router, Tailwind CSS, JavaScript (ES6+)
- **Backend:** Node.js, Express, JWT, Bcrypt
- **Databases:** PostgreSQL (Prisma ORM), MongoDB (Mongoose)
- **AI/LLM:** External LLM API (e.g., OpenAI, Gemini, or Claude)

## Features

- **User Authentication:** Secure registration and login using JSON Web Tokens (JWT).
- **Academic Management:** Create, read, update, and delete courses, assignments, and tasks.
- **Dashboard:** An overview of academic progress, upcoming deadlines, and task completion status.
- **AI Tutor:** An interactive chat interface to ask academic questions, receiving structured, easy-to-understand explanations with examples and quizzes.
- **AI Study Planner:** Generates customized study schedules based on user availability, exam dates, and current skill levels.
- **Conversation History:** Persisted AI conversations for future reference.
