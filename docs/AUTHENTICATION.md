# Authentication Guide

## Overview
StudyPilot uses JSON Web Tokens (JWT) for stateless authentication.

## 1. Registration (`POST /api/auth/register`)
**Payload:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword123"
}
```
**Process:** Validates input, hashes password using `bcrypt`, stores in PostgreSQL, and returns a JWT token.

## 2. Login (`POST /api/auth/login`)
**Payload:**
```json
{
  "email": "jane@example.com",
  "password": "securepassword123"
}
```
**Process:** Verifies credentials against hashed password. Upon success, generates a signed JWT containing `{ id, role }`.

## 3. Google OAuth (`POST /api/auth/google`)
**Payload:**
```json
{
  "token": "eyJhbGciOiJSUz..."
}
```
**Process:** Verifies the `idToken` using `google-auth-library`. Finds or provisions the user in the PostgreSQL database, bypassing standard password hashing for federated identities. Returns a standard application JWT.

## 4. RBAC (Role-Based Access Control)
Roles: `STUDENT`, `TEACHER`, `ADMIN`.
- Endpoints can be wrapped in `requireRole('ADMIN')` found in `roleMiddleware.js`.

## 5. Data Ownership Enforcement
We *do not* trust the `userId` in POST bodies or Query Strings for resource operations (like updating a task). Instead, all controllers extract `req.user.id` from the verified JWT token to enforce strict horizontal authorization (User A cannot access User B's records).
