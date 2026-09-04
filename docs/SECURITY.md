# Security Architecture

## 1. Password Hashing
All user passwords are hashed using `bcryptjs` with a cost factor of 10. Passwords are never stored or transmitted in plain text.

## 2. Token Storage
This educational Single Page Application (SPA) relies on stateless JWTs.
**Tradeoffs Documented:** 
- `HttpOnly` cookies provide better protection against XSS.
- `localStorage` + `Authorization: Bearer` headers simplify cross-origin development (CORS) between Vite (port 5174) and Express (port 5001) without complex credentials proxying. We accepted the XSS risk for ease of local educational setup, but all inputs are sanitized using Zod to mitigate injection risks.

## 3. Route Protection
All domain routes (`/api/courses`, `/api/tasks`, `/api/assignments`, `/api/dashboard`, `/api/conversations`) are protected via the `authMiddleware.js`. This middleware enforces a valid JWT signature and expiration.

## 4. Input Sanitization & Request Validation
- **Zod schemas** strictly define allowed shapes, types, and lengths for incoming POST/PATCH requests.
- Prisma acts as our ORM, meaning we use **parameterized queries** natively. We never concatenate SQL strings, preventing SQL Injection.

## 5. Security Headers
We use `Helmet` to secure Express HTTP headers out-of-the-box (e.g., hiding `X-Powered-By`, setting `X-Content-Type-Options`).

## 6. Rate Limiting
We utilize `express-rate-limit` combined with `rate-limit-redis` to rate-limit authentication endpoints (`/api/auth/*`). This heavily mitigates brute-force credential stuffing attacks by tracking IP addresses in a centralized Redis store.
