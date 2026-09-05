# Redis Caching Architecture

StudyPilot utilizes Redis to alleviate database load for frequently accessed, read-heavy endpoints via a Cache-Aside strategy.

## Cached Endpoints
- **`GET /api/courses`**: Retrieves the list of courses owned by the authenticated user.

## Architecture: Cache-Aside
When a request is made to a cached endpoint:
1. **Cache Miss**: The application attempts to fetch the data from Redis. If it's missing (or expired), it queries PostgreSQL. The application then immediately returns the DB response to the user while asynchronously storing the serialized JSON response in Redis with a TTL.
2. **Cache Hit**: If the data exists in Redis, the DB query is bypassed entirely, and the cached JSON is parsed and returned.

## Cache Key Format & Security
Cache keys are **strictly scoped** to the authenticated user identity to guarantee data isolation:
`studypilot:<entity>:user:<userId>`
For example: `studypilot:courses:user:b6abfa92-f041-4a6e-8d72-c514fcf29632`

This guarantees User A can never accidentally receive a cached response belonging to User B. The `userId` is derived exclusively from the verified JWT payload (`req.user.id`), preventing client-side spoofing.

## TTL (Time To Live)
The TTL for the courses catalog is set deliberately to **60 seconds**.
*Rationale:* Educational catalogs do not require millisecond-level real-time accuracy across multiple devices. A 60-second TTL dramatically reduces read spikes against PostgreSQL while remaining responsive enough for daily use.

## Cache Invalidation
Whenever a mutation occurs, the cache becomes stale and must be evicted. The following operations immediately call `cacheService.delete(key)`:
- `POST /api/courses` (Course creation)
- `PUT /api/courses/:id` (Course update)
- `DELETE /api/courses/:id` (Course deletion)

## Fallback & Fault Tolerance
Redis is treated as an ephemeral layer. If the Redis service is disconnected, times out, or throws an exception, the application **safely ignores the failure** and queries PostgreSQL. A Redis outage will *never* crash the API or result in a 500 Error for cacheable routes.

If a Redis payload becomes corrupted (invalid JSON), the `cache.service.js` will intercept the `JSON.parse()` exception, automatically evict the corrupted key, and execute a standard DB fallback.

## Testing
To verify the 7 core caching principles (Miss, Hit, TTL, Invalidation, User Isolation, Fallback, and Corruption Handling):
```bash
node test_cache.js
```
