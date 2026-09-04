# Proposed Folder Structure

```text
StudyPilot/
├── .gitignore
├── README.md
├── RUBRIC.md
├── docs/
│   ├── architecture.md
│   ├── api-specification.md
│   ├── database-erd.md
│   ├── folder-structure.md
│   ├── implementation-roadmap.md
│   └── javascript-concepts.md
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx             # React entry point
│   │   ├── App.jsx              # Main routing component
│   │   ├── index.css            # Tailwind & global styles
│   │   ├── assets/              # Images, icons
│   │   ├── components/          # Reusable UI components
│   │   │   ├── layout/          # Navbar, Sidebar
│   │   │   ├── common/          # Modal, LoadingSpinner, ErrorMessage
│   │   │   └── domain/          # StatsCard, CourseCard, AssignmentCard, TaskCard
│   │   ├── pages/               # Route components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Courses.jsx
│   │   │   ├── CourseDetails.jsx
│   │   │   ├── Assignments.jsx
│   │   │   ├── Tasks.jsx
│   │   │   ├── AITutor.jsx
│   │   │   ├── StudyPlanner.jsx
│   │   │   └── Conversations.jsx
│   │   ├── services/            # API call modules (fetch/axios)
│   │   ├── hooks/               # Custom React hooks (e.g., useAuth)
│   │   ├── context/             # React Context (e.g., AuthContext)
│   │   └── utils/               # Formatting, helpers
│
└── backend/
    ├── package.json
    ├── .env.example
    ├── prisma/
    │   └── schema.prisma        # PostgreSQL schema
    ├── src/
    │   ├── server.js            # Express app entry point
    │   ├── config/              # Environment variables, DB connections
    │   ├── middleware/          # auth, errorHandler, validation, logging
    │   ├── routes/              # Express routers
    │   ├── controllers/         # Request handling logic
    │   ├── services/            # Business logic & AI API calls
    │   ├── models/              # Mongoose schemas (MongoDB)
    │   └── utils/               # Helpers, token generation
```

## Key Architectural Decisions in Folder Structure
- **Monorepo Style:** Both frontend and backend are housed in the same root repository for easier project management, though they run as separate services.
- **Feature-Based vs Layer-Based:** The backend uses a layer-based structure (`routes`, `controllers`, `services`) which is standard for Express applications, promoting separation of concerns.
- **Reusable UI:** The frontend `components` folder is divided into `layout`, `common`, and `domain` to prevent "giant components" and encourage reuse.
