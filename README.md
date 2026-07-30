# ResuLens

[![CI](https://github.com/OmegaZeroG/ResuLens/actions/workflows/ci.yml/badge.svg)](https://github.com/OmegaZeroG/ResuLens/actions/workflows/ci.yml)

AI Resume Analyzer & JD-Based ATS Optimizer, with a custom rate-limited AI gateway.

Full plan: see `../ResuLens-Project-Plan.docx` and `../TASKS.md` / `../PROGRESS.md` in the parent folder.

## Stack

React (Vite) + Tailwind · Node/Express · MongoDB Atlas · Redis (Upstash) · Gemini API · ImageKit · JWT

## Structure

```
ResuLens/
├── client/     React (Vite) frontend
└── server/     Express API
```

## Local setup

### Server
```
cd server
cp .env.example .env   # fill in your own MongoDB URI, JWT secret, API keys
npm install
npm run dev
```

### Client
```
cd client
npm install
npm run dev
```

Client runs on http://localhost:5173, API on http://localhost:5000.

## AI rate limiting — design notes

Every Gemini call (`/api/analyze`, `/api/analyze/improve`) is metered per user with a token-bucket rate limiter, enforced atomically in Redis (Upstash) via a Lua script. This exists because Gemini calls cost real money/quota — without a limit, one user in a loop, a retry bug, or a scripted request against the API could burn through the whole app's quota and break it for everyone else, not just the offending user.

**Why token bucket, not a plain counter.** The simplest alternative is `INCR` a per-hour key with `EXPIRE` — genuinely less code, and `INCR` is already atomic on its own. Its flaw is the classic fixed-window boundary burst: a user can spend their whole quota at 12:59:59, then immediately get a full new quota at 1:00:01 — up to 2x the intended rate right at the hour mark. A token bucket refills continuously instead of resetting in a hard cliff, so that edge case doesn't exist. For a low-traffic project this is a minor difference in practice, but it's the standard approach for a reason and was worth doing properly.

**Why Redis specifically, not an in-memory counter.** An in-memory counter only lives in one Node process's RAM. It's wiped by every restart (a deploy, a crash, or — on a free-tier host that spins down on inactivity — just normal idle behavior), silently resetting everyone's usage. It also breaks the moment there's more than one server instance, since each instance would keep its own separate count and a user could multiply their real limit just by which instance happened to handle each request. Redis is a single shared store every instance talks to, so the limit holds regardless of how many processes are running or how often they restart.

**Why a Lua script, not separate GET/SET calls.** Checking "do I have enough tokens" and decrementing them has to happen as one atomic operation. Two round trips (read, then write) leaves a race window where two concurrent requests can both read "1 token left" and both proceed, over-spending the bucket. `EVAL` runs the whole check-and-decrement as a single atomic operation inside Redis itself, so concurrent requests from the same user can't race past the limit. The script also reads Redis's own clock (`TIME`) rather than trusting the app server's clock, so it stays correct even if they drift.

**Design choices:**
- Tiered by the existing `User.plan` field — `free`: 5 requests/hour, `premium`: 30/hour. `Improve` costs 2x an `Analyze` (it's a full resume rewrite, not just a score).
- **Fails open, not closed.** If Redis isn't configured, or a request to it errors, AI features keep working unlimited rather than the whole app breaking over a rate-limiter outage. A protective feature shouldn't itself become the single point of failure for the thing it's protecting.
- Every check (allowed or blocked) is logged to Mongo (`RateLimitEvent`) purely for visibility — a user's own usage history is viewable in the app. Redis remains the only source of truth for enforcement; the log is never read by the limiter itself.
- `X-RateLimit-Limit/Remaining/Reset/Tier` response headers, following the same convention as GitHub/Stripe's rate-limit headers, so the client (or any other API consumer) can react to quota state without guessing.

**Testing.** `server/src/middleware/tokenBucketReference.js` is a pure-JS mirror of the Lua script's algorithm, covered by `tokenBucketReference.test.js` (burst limits, per-user isolation, refill-over-time, the 2x cost tier). `rateLimiter.test.js` covers the actual middleware — header setting, tiering, the fail-open paths, and the 429 response — with Redis and Mongo mocked. Run with `npm test` inside `server/`.
