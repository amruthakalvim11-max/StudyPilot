# Database Design & Normalization

This document explains the relational database design for StudyPilot using PostgreSQL and Prisma, focusing on normalization principles and indexing choices.

## 1. Normalization Decisions
The database is designed up to the Third Normal Form (3NF) to eliminate data redundancy and ensure data integrity.

### Eliminating Redundancy
- **No Duplicated User Info:** The `Course`, `Assignment`, and `Task` tables do not store `userName` or `userEmail`. Instead, they reference the `User` table via `userId` foreign keys.
- **No Duplicated Course Info:** `Assignment` and `Task` do not store the `courseName`. They reference `Course` (or `Assignment`) via foreign keys (`courseId`, `assignmentId`), relying on JOINs to fetch the contextual names when needed.
- **Enums for Strict Data Typing:** Instead of arbitrary strings, we use Enums (`Role`, `AssignmentStatus`, `TaskPriority`, `TaskStatus`) to ensure data consistency and prevent spelling errors/inconsistencies (e.g., preventing "In Progress" vs "IN_PROGRESS").

## 2. Relationships (Foreign Keys)
- **User (1) &harr; (N) Course:** `Course.userId` links a course to its creator/owner.
- **Course (1) &harr; (N) Assignment:** `Assignment.courseId` links an assignment to a specific course.
- **User (1) &harr; (N) Task:** `Task.userId` links a task to its owner, allowing tasks to exist independently of courses/assignments if needed.
- **Assignment (1) &harr; (N) Task:** `Task.assignmentId` (nullable) links a task to a specific assignment.

All foreign keys use strict relational mapping to guarantee referential integrity (e.g., if a User is deleted, their related Courses can cascade delete or restrict deletion based on business logic).

## 3. Indexing Strategy
To optimize the real-world queries the application will run, specific indexes have been added to the Prisma schema:

| Table | Index | Reason |
|-------|-------|--------|
| `User` | `email` (Unique) | Frequently queried for authentication/login lookups. Unique constraint inherently creates an index. |
| `Course` | `userId` | The primary access pattern for courses is "fetch courses by the current user" (e.g., Dashboard, Courses list). |
| `Assignment`| `courseId` | Filtering assignments by a specific course. |
| `Task` | `userId` | Fetching all tasks for the logged-in user. |
| `Task` | `assignmentId` | Grouping or fetching tasks that belong to a specific assignment. |
| `Task` | `status` | The dashboard frequently filters tasks by status (e.g., "show pending tasks"). |
| `Task` | `priority` | The UI allows sorting/filtering tasks by priority (e.g., "show HIGH priority tasks"). |
| `Task` | `dueDate` | The dashboard requires querying upcoming deadlines (e.g., `orderBy: { dueDate: 'asc' }`). |
