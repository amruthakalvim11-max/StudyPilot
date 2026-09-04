# Database ERD Description

StudyPilot uses two database systems: PostgreSQL for relational academic data, and MongoDB for flexible AI conversation data.

## 1. PostgreSQL (Relational Data)

The relational schema is managed using Prisma ORM.

### Entities and Attributes:

**User**
- `id` (PK, UUID)
- `name` (String)
- `email` (String, Unique)
- `passwordHash` (String)
- `createdAt` (DateTime)

**Course**
- `id` (PK, UUID)
- `name` (String)
- `description` (Text)
- `userId` (FK -> User.id)
- `createdAt` (DateTime)

**Assignment**
- `id` (PK, UUID)
- `courseId` (FK -> Course.id)
- `title` (String)
- `description` (Text)
- `deadline` (DateTime)
- `status` (Enum: PENDING, IN_PROGRESS, COMPLETED)

**Task**
- `id` (PK, UUID)
- `userId` (FK -> User.id)
- `assignmentId` (FK -> Assignment.id, Nullable)
- `title` (String)
- `priority` (Enum: LOW, MEDIUM, HIGH)
- `status` (Enum: PENDING, COMPLETED)
- `dueDate` (DateTime)

### Relationships:
- **User (1) to Courses (N):** A user can have multiple courses.
- **Course (1) to Assignments (N):** A course can have multiple assignments.
- **Assignment (1) to Tasks (N):** An assignment can be broken down into multiple tasks.
- **User (1) to Tasks (N):** A user owns multiple tasks (some tasks may be standalone and not linked to an assignment).

*Demonstrating SQL JOINs:* To display a dashboard with pending tasks for specific courses, a JOIN operation connects `Task -> Assignment -> Course -> User`.

---

## 2. MongoDB (Document Data)

The document schema is managed using Mongoose.

**Why MongoDB?**
AI conversations have a highly flexible and nested structure. A single conversation contains a variable-length array of messages. As LLM models evolve, we might need to store additional metadata (e.g., tokens used, model version) per message, which is easier to adapt in a document database without complex migrations.

### Collections and Documents:

**Conversation Collection**
- `_id` (ObjectId)
- `userId` (String - matches PostgreSQL User ID)
- `title` (String)
- `createdAt` (Date)
- `updatedAt` (Date)
- `messages` (Array of nested Message objects)

**Message (Nested Sub-document)**
- `role` (String - e.g., 'user', 'assistant', 'system')
- `content` (String - The text/JSON payload)
- `timestamp` (Date)
