# Development Environment

This document captures the runtime environment: what servers run, on what ports, in what order, and how to verify they're healthy.

---

## Servers

| Server | Port | Start Command | Health Check | Notes |
|--------|------|---------------|--------------|-------|
| Vite + Hono | 5173 | `bun run dev` | `curl localhost:5173/api/message` | Frontend SSR + API combined |

### Quick Start

```bash
# Single terminal - runs everything
bun run dev
```

The development server serves both the React frontend (with SSR) and the Hono API routes at `/api/*`.

---

## Port Assignments

| Port | Service | Protocol | Notes |
|------|---------|----------|-------|
| 5173 | Vite dev server | HTTP | Frontend + API combined |

**Rule:** Never reuse ports. If you add a service, pick an unused port and document it here.

---

## Environment Variables

### Required

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk frontend auth | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk backend auth | `sk_test_...` |
| `RESEND_API_KEY` | Email sending | `re_...` |
| `EMAIL_FROM` | Sender address | `Todo App <noreply@example.com>` |

### Local Setup

Create a `.dev.vars` file (Cloudflare Workers local dev):

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
RESEND_API_KEY=re_...
EMAIL_FROM=Todo App <noreply@yourdomain.com>
```

> **Note:** `.dev.vars` is the Cloudflare Workers equivalent of `.env` for local development.

---

## Health Checks

Run these to verify the environment is working:

```bash
# API health check
curl http://localhost:5173/api/message
# Expected: "Hello Hono!"

# Frontend
# Open http://localhost:5173 in browser
# Expected: Login page or todo list (if authenticated)
```

### Health Check vs Functional Check

> **Warning:** A passing health check doesn't mean the service works.

| Check Type | What It Tests | Example |
|------------|---------------|---------|
| Health check | Process alive | `/api/message` returns "Hello Hono!" |
| Functional check | Auth + DB work | `/api/todo` returns todos for logged-in user |

---

## Cloudflare Resources (Local)

For local development, Wrangler simulates Cloudflare resources:

| Resource | Local Behavior | Production |
|----------|----------------|------------|
| D1 Database | SQLite file in `.wrangler/` | Cloudflare D1 |
| R2 Bucket | Local filesystem | Cloudflare R2 |
| Queues | In-memory queue | Cloudflare Queues |
| Cron | Manual trigger only | Scheduled triggers |

### Running Migrations Locally

```bash
bun run migrations:apply --local
```

### Testing Cron Jobs

Cron jobs don't run automatically in dev. Test manually:

```bash
# Trigger scheduled event
wrangler dev --test-scheduled
```

---

## Common Environment Issues

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `EADDRINUSE` | Port 5173 in use | Kill process: `lsof -ti:5173 \| xargs kill` |
| API returns 401 | Missing/invalid Clerk keys | Check `.dev.vars` has correct keys |
| Emails not sending | Invalid Resend API key | Verify key at resend.com dashboard |
| D1 errors | Missing migrations | Run `bun run migrations:apply --local` |
| "binding not found" | Wrangler not configured | Check `wrangler.jsonc` bindings |

See `docs/TROUBLESHOOTING.md` for detailed resolution steps.

---

*Last Updated: 2026-01-18*
