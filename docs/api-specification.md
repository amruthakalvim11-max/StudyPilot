# API Specification

All requests and responses use `application/json`.
Responses adhere to the following standard structure:

**Success Response Format:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response Format:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

## Authentication

- **`POST /api/auth/register`**
  - **Body:** `{ "name", "email", "password" }`
  - **Response (201):** User data and JWT token.

- **`POST /api/auth/login`**
  - **Body:** `{ "email", "password" }`
  - **Response (200):** User data and JWT token.

*(All endpoints below require a valid JWT via the `Authorization: Bearer <token>` header)*

## Courses

- **`GET /api/courses`**
  - **Response (200):** Array of user's courses.
- **`POST /api/courses`**
  - **Body:** `{ "name", "description" }`
  - **Response (201):** Created course.
- **`GET /api/courses/:id`**
  - **Response (200):** Course details.
- **`PATCH /api/courses/:id`**
  - **Body:** Partial course data.
  - **Response (200):** Updated course.
- **`DELETE /api/courses/:id`**
  - **Response (200):** Success message.

## Assignments

- **`GET /api/assignments`**
  - **Response (200):** Array of user's assignments.
- **`POST /api/assignments`**
  - **Body:** `{ "courseId", "title", "description", "deadline", "status" }`
  - **Response (201):** Created assignment.
- **`GET /api/assignments/:id`**
  - **Response (200):** Assignment details.
- **`PATCH /api/assignments/:id`**
  - **Response (200):** Updated assignment.
- **`DELETE /api/assignments/:id`**
  - **Response (200):** Success message.

## Tasks

- **`GET /api/tasks`**
  - **Query Params:** `?status=PENDING&priority=HIGH`
  - **Response (200):** Array of tasks.
- **`POST /api/tasks`**
  - **Body:** `{ "assignmentId" (optional), "title", "priority", "status", "dueDate" }`
  - **Response (201):** Created task.
- **`GET /api/tasks/:id`**
  - **Response (200):** Task details.
- **`PATCH /api/tasks/:id`**
  - **Response (200):** Updated task.
- **`DELETE /api/tasks/:id`**
  - **Response (200):** Success message.

## AI Features

- **`POST /api/ai/ask`**
  - **Body:** `{ "question": "Explain closures" }`
  - **Response (200):** 
    ```json
    {
      "topic": "...",
      "definition": "...",
      "simpleExplanation": "...",
      "analogy": "...",
      "example": "...",
      "commonMistakes": [],
      "quiz": [{ "question": "...", "answer": "..." }]
    }
    ```

- **`POST /api/ai/study-plan`**
  - **Body:** `{ "examDate", "topics", "hoursPerDay", "skillLevel" }`
  - **Response (200):**
    ```json
    {
      "exam": "...",
      "days": [
        { "day": 1, "topic": "...", "hours": 2, "tasks": [] }
      ]
    }
    ```

## AI Conversations (MongoDB)

- **`GET /api/conversations`**
  - **Response (200):** Array of conversation metadata.
- **`POST /api/conversations`**
  - **Body:** `{ "title", "initialMessage" }`
  - **Response (201):** Created conversation.
- **`GET /api/conversations/:id`**
  - **Response (200):** Conversation history (array of messages).
- **`PATCH /api/conversations/:id`**
  - **Body:** `{ "newMessage": { "role", "content" } }`
  - **Response (200):** Updated conversation.
- **`DELETE /api/conversations/:id`**
  - **Response (200):** Success message.
