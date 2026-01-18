# Development Environment

This document captures the runtime environment: what servers run, on what ports, in what order, and how to verify they're healthy.

---

## Servers

<!-- Fill in for your project -->

| Server | Port | Start Command | Health Check | Notes |
|--------|------|---------------|--------------|-------|
| Backend | 5173 | `bun run dev` | `curl localhost:3000/api/health` |  |
| [Service] | [Port] | [Command] | [Check] | [Notes] |



### Quick Start

```bash
# Terminal 1
bun run dev




### Port Assignments

| Port | Service | Protocol | Notes |
|------|---------|----------|-------|
| 5173 | Frontend dev (vite + RR7) + backend (hono) at /api | HTTP | Vite default |
| [Port] | [Service] | [Protocol] | [Notes] |

**Rule:** Never reuse ports. If you add a service, pick an unused port and document it here.

---

## Environment Variables

### Required

| Variable | Purpose | Example |
|----------|---------|---------|
| `RESEND_API_KEY` | API Key for resend | `re_xxx` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | 'pk_***' |
| `CLERK_SECRET_KEY` | Clerk secret key | 'sk_***' |
| `[VAR]` | [Purpose] | [Example] |


### Local Setup

```bash
# Copy template
cp .env.example .env

# Edit with your values
# Never commit .env to git
```

---

## Health Checks

Run these to verify the environment is working:

```bash
# Backend health
curl http://localhost:5173/api/health
# Expected: {"status":"ok"} or 200 response

# Frontend
# Open http://localhost:5173 in browser
# Expected: App loads without console errors

```


### Health Check vs Functional Check

> **Warning:** A passing health check doesn't mean the service works.

Health endpoints often only verify "process is running"—not that the service can actually do its job. For critical services:

| Check Type | What It Tests | Example |
|------------|---------------|---------|
| Health check | Process alive, dependencies connected | `/health` returns 200 |
| Functional check | Actual capability works | `/ocr` processes a test image |

**Startup scripts should test functional endpoints**, not just health endpoints. A service with a loaded model that can't process requests is broken, even if `/health` returns OK.

---

## Common Environment Issues

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `EADDRINUSE` | Port already in use | Kill process on that port or change port |
| API returns HTML | Wrong server responding (port mismatch) | Check proxy config, verify correct port |
| `ECONNREFUSED` | Service not running | Start the service |
| CORS errors | Frontend/backend port mismatch | Check Vite proxy config |
| "Model not loaded" | Service started but not ready | Wait for ready message, check logs |

See `docs/TROUBLESHOOTING.md` for detailed resolution steps.

*Last Updated: [Date]*
