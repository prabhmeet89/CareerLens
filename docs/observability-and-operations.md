# CareerLens Observability & Operations Guide

This guide details CareerLens's operational health endpoints, structured logging format, request correlation headers, AI telemetry, and Redis caching architecture.

---

## 1. Operational Health Endpoints

CareerLens provides dedicated, lightweight health endpoints for load balancers, container orchestrators (e.g. Render, Docker, Kubernetes), and uptime monitoring systems:

| Endpoint | Method | Purpose | Expected Status Code | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | **Liveness Probe** | `200 OK` | Fast process confirmation. Returns process uptime, timestamp, and service identifier. |
| `/api/health/live` | `GET` | **Liveness Probe** | `200 OK` | Standard alias for orchestrator liveness checks. |
| `/api/health/ready` | `GET` | **Readiness Probe** | `200 OK` / `503 Unavailable` | Validates that required dependencies (MongoDB) are connected to accept traffic. |
| `/api/health/detailed` | `GET` | **Diagnostics** | `200 OK` / `503 Unavailable` | Safe operational status of MongoDB, Redis, and Gemini configuration without exposing credentials. |

### Example Diagnostic Response (`GET /api/health/detailed`)
```json
{
  "status": "healthy",
  "service": "CareerLens API",
  "version": "1.0.0",
  "uptimeSeconds": 342,
  "dependencies": {
    "mongodb": {
      "status": "connected",
      "healthy": true
    },
    "redis": {
      "configured": true,
      "status": "connected",
      "optional": true
    },
    "geminiAI": {
      "configured": true,
      "model": "gemini-3.6-flash",
      "fallbackAvailable": true
    }
  },
  "timestamp": "2026-08-25T16:45:00.000Z"
}
```

---

## 2. Request Correlation (`X-Request-Id`)

Every HTTP request to CareerLens is assigned a unique UUID v4:
- The server accepts valid incoming `X-Request-Id` headers or automatically generates a fresh ID via `requestId` middleware.
- The ID is attached to `req.id` and echoed back in the response header `X-Request-Id`.
- Error responses include `requestId` in the response payload for rapid triage.
- The frontend Axios interceptor captures `requestId` on failed responses for seamless client-to-server trace correlation.

---

## 3. Structured Logging Architecture

CareerLens uses environment-tailored logging:
- **Production (`NODE_ENV=production`)**: Emits structured JSON events to `stdout` containing:
  - `timestamp`: ISO-8601 timestamp
  - `level`: Log level (`info`, `warn`, `error`, `http`)
  - `service`: `careerlens-api`
  - `requestId`: Correlation ID
  - `method` / `path` / `statusCode` / `durationMs`
- **Development**: Emits clean, readable console lines with response timings.
- **Redaction Policy**: Passwords, auth tokens, cookies, resume text, raw prompts, and API keys are strictly excluded from all log payloads.

---

## 4. AI Latency & Failure Observability

All Gemini AI request paths (`resume_analysis`, `match_explanation`, `roadmap_generation`) are instrumented with monotonic high-resolution timers (`performance.now()`) and structured telemetry:

```
[AI Metric] type=match_explanation model=gemini-3.6-flash durationMs=420 status=success attempts=1
[AI Metric] type=roadmap_generation model=gemini-3.6-flash durationMs=850 status=repaired_json attempts=1
[AI Metric] type=resume_analysis model=heuristic_fallback durationMs=12 status=heuristic_fallback attempts=4
```

### Monitored Status Categories
- `success`: First-attempt completion with native JSON parsing.
- `repaired_json`: JSON repair prompt invoked and parsed successfully.
- `fallback_used`: Primary model timed out or failed; secondary fallback model succeeded.
- `heuristic_fallback`: External API unavailable or quota reached; deterministic heuristic fallback used gracefully.
- `failed`: Terminal failure across all available models.

---

## 5. Redis Caching & Graceful Degradation

- **Cache Keys**: Centralized in `backend/src/utils/cacheKeys.js` (e.g., `recommended:<userId>:p<page>:l<limit>`).
- **Invalidation**: `invalidateRecommendations(userId)` flushes all pages via `delCache('recommended:<userId>:*')` when resume skills, applications, or saved jobs are updated.
- **Graceful Fallback**: If Redis is not configured (`REDIS_URL` missing) or temporarily offline, all cache operations silently return `null` and fallback to direct MongoDB queries without impacting application stability.

---

## 6. Running Tests

```bash
# Run complete backend test suite (including Redis & Health suites)
cd backend
npm test

# Run frontend production bundle validation & linter
cd frontend
npm run lint
npx vite build
```
