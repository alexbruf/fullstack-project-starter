# External Integrations Reference

This document captures setup, configuration, and troubleshooting for external services.

---

## Clerk (Authentication)

### Overview
Clerk provides user authentication with pre-built UI components and session management.

### Setup

1. Create account at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy keys from Dashboard > API Keys

### Environment Variables

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...  # Frontend (public)
CLERK_SECRET_KEY=sk_test_...            # Backend (secret)
```

### Integration Points

| Location | Package | Purpose |
|----------|---------|---------|
| `src/root.tsx` | `@clerk/react-router` | `<ClerkProvider>` wrapper |
| `src/api/api.ts` | `@hono/clerk-auth` | API route middleware |

### Usage Pattern

```typescript
// Frontend - check auth status
import { useAuth } from "@clerk/react-router";
const { isSignedIn, userId } = useAuth();

// Backend - protect API routes
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
api.use("*", clerkMiddleware({ publishableKey, secretKey }));
const auth = getAuth(c);
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 on all requests | Missing/wrong keys | Verify `.dev.vars` matches Clerk dashboard |
| "Invalid token" | Expired session | Clear cookies, re-login |
| SSR hydration mismatch | Auth state differs | Ensure `<ClerkProvider>` wraps app |

---

## Resend (Email)

### Overview
Resend provides transactional email delivery with React Email templates.

### Setup

1. Create account at [resend.com](https://resend.com)
2. Verify a sending domain (or use sandbox for testing)
3. Create API key from Dashboard > API Keys

### Environment Variables

```bash
RESEND_API_KEY=re_...
EMAIL_FROM=Todo App <noreply@yourdomain.com>
```

### Integration Points

| Location | Purpose |
|----------|---------|
| `src/lib/background/queue.tsx` | `QueueManager` sends emails |
| `src/emails/` | React Email templates |

### Usage Pattern

```typescript
import { Resend } from "resend";
import { render } from "@react-email/render";
import { MyEmailTemplate } from "~/emails/my-template";

const resend = new Resend(env.RESEND_API_KEY);
await resend.emails.send({
  from: env.EMAIL_FROM,
  to: userEmail,
  subject: "Subject",
  html: await render(<MyEmailTemplate {...props} />),
});
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Emails not sending | Invalid API key | Verify key at resend.com |
| Emails go to spam | Unverified domain | Verify domain DNS records |
| "From address not allowed" | Domain not verified | Use verified domain or sandbox |

---

## Cloudflare D1 (Database)

### Overview
D1 is Cloudflare's serverless SQLite database, accessed via Kysely ORM.

### Setup

```bash
# Create database
wrangler d1 create "todo-db"

# Update wrangler.jsonc with the database ID
```

### Configuration (`wrangler.jsonc`)

```jsonc
{
  "d1_databases": [
    {
      "binding": "TODO_DB",
      "database_name": "todo-db",
      "database_id": "your-database-id"
    }
  ]
}
```

### Integration Points

| Location | Purpose |
|----------|---------|
| `src/lib/db.ts` | Kysely setup with D1Dialect |
| `migrations/` | SQL migration files |

### Usage Pattern

```typescript
import { getDB } from "~/lib/db";

const db = await getDB(c.env);
const todos = await db
  .selectFrom("todo")
  .selectAll()
  .where("user_id", "=", userId)
  .execute();
```

### Migrations

```bash
# Create new migration
bun run migrations:create add-new-table

# Apply locally
bun run migrations:apply --local

# Apply to production
bun run migrations:apply --remote
```

---

## Cloudflare R2 (Object Storage)

### Overview
R2 provides S3-compatible object storage for file uploads (CSV exports).

### Setup

```bash
wrangler r2 bucket create "todo-exports"
```

### Configuration (`wrangler.jsonc`)

```jsonc
{
  "r2_buckets": [
    {
      "binding": "TODO_EXPORTS",
      "bucket_name": "todo-exports"
    }
  ]
}
```

### Usage Pattern

```typescript
// Upload file
const key = `${crypto.randomUUID()}.csv`;
await c.env.TODO_EXPORTS.put(key, csvContent, {
  httpMetadata: { contentType: "text/csv" }
});

// Download file
const obj = await c.env.TODO_EXPORTS.get(key);
if (obj) {
  return new Response(obj.body);
}
```

---

## Cloudflare Queues (Background Jobs)

### Overview
Queues enable async processing for email notifications.

### Setup

```bash
wrangler queues create "email-queue"
```

### Configuration (`wrangler.jsonc`)

```jsonc
{
  "queues": {
    "producers": [{ "queue": "email-queue", "binding": "EMAIL_QUEUE" }],
    "consumers": [{ "queue": "email-queue" }]
  }
}
```

### Integration Points

| Location | Purpose |
|----------|---------|
| `src/api/api.ts` | Producer - sends messages |
| `src/workers/queue.tsx` | Consumer - processes messages |

### Usage Pattern

```typescript
// Producer - send message
await c.env.EMAIL_QUEUE.send({
  newlyCompletedTodo: { email, title }
});

// Consumer - handle message (in queue.tsx)
export default {
  async queue(batch, env) {
    for (const msg of batch.messages) {
      await processMessage(msg.body, env);
      msg.ack();
    }
  }
};
```

---

## Quick Reference

### Environment Variables

```bash
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Resend
RESEND_API_KEY=re_...
EMAIL_FROM=Todo App <noreply@yourdomain.com>
```

### Key Files

| File | Purpose |
|------|---------|
| `wrangler.jsonc` | Cloudflare bindings configuration |
| `.dev.vars` | Local environment variables |
| `src/lib/db.ts` | Database connection setup |
| `src/lib/background/queue.tsx` | Email queue manager |

---

*Last Updated: 2026-01-18*
