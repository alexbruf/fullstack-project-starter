# Architecture

## Project Overview

Fullstack Project Starter is a Todo application demonstrating a modern fullstack architecture on Cloudflare Workers with React Router v7.

**Owner:** [Your Name/Team]

## Tech Stack

- **Frontend:** React 19 + React Router v7 (SSR via Vite)
- **Data Fetching:** React Router loaders (route-level), TanStack Query (component-level)
- **Backend:** Hono on Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite) via Kysely
- **Storage:** Cloudflare R2 (for CSV exports)
- **Queue:** Cloudflare Queues (async email processing)
- **Email:** Resend
- **Auth:** Clerk
- **UI:** shadcn/ui + Tailwind CSS v4

## Application Features

| Feature | Purpose | Key Files |
|---------|---------|-----------|
| Todo CRUD | Create, read, update, delete todos | `src/api/api.ts`, `src/routes/home/` |
| Todo Export | Export todos to CSV via R2 | `src/api/api.ts` (export endpoints) |
| Email Notifications | Send email on todo completion | `src/workers/queue.tsx`, `src/emails/` |
| Daily Digest | Scheduled daily email summary | `src/workers/cron.ts` |

## Directory Structure

```
/
├── src/
│   ├── api/                    # Hono API routes
│   │   ├── api.ts              # Todo CRUD + export endpoints
│   │   └── app.ts              # Hono app setup with React Router SSR
│   ├── components/
│   │   └── ui/                 # shadcn/ui components
│   ├── emails/                 # React Email templates
│   │   ├── daily-email.tsx     # Daily summary email
│   │   └── new-todo-complete.tsx # Todo completion email
│   ├── lib/
│   │   ├── db.ts               # Kysely D1 database setup
│   │   ├── utils.ts            # Utility functions (cn, etc.)
│   │   └── background/         # Background job utilities
│   │       └── queue.tsx       # QueueManager for email sending
│   ├── routes/
│   │   └── home/               # Home page route components
│   │       ├── page.tsx        # Main todo list page
│   │       ├── columns.tsx     # Table column definitions
│   │       ├── data-table.tsx  # Data table component
│   │       └── create-todo-dialog.tsx # Create todo form
│   ├── workers/
│   │   ├── app.ts              # Worker entry point
│   │   ├── cron.ts             # Scheduled job handler
│   │   └── queue.tsx           # Queue consumer
│   ├── entry.server.tsx        # SSR entry point
│   ├── root.tsx                # App root with Clerk
│   ├── routes.ts               # Route definitions
│   └── context.ts              # React context for env
├── migrations/                 # D1 database migrations
├── scripts/
│   └── check-file-length.js    # Quality gate script
├── tests/                      # Test files + inventory
├── docs/                       # Documentation
└── .husky/                     # Git hooks
```

## Data Sources

### Primary Data Source: Cloudflare D1

| Table | Purpose |
|-------|---------|
| `todo` | User todos with title, completion status, timestamps |

**Schema:**
- `id` - INTEGER PRIMARY KEY AUTOINCREMENT
- `user_id` - VARCHAR(255) NOT NULL (Clerk user ID)
- `title` - VARCHAR(255)
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `completed_date` - TIMESTAMP NULL

### External Storage: Cloudflare R2

| Bucket | Purpose |
|--------|---------|
| `TODO_EXPORTS` | Stores CSV exports of user todos |

### Queue: Cloudflare Queues

| Queue | Purpose |
|-------|---------|
| `EMAIL_QUEUE` | Async email sending on todo completion |

## API Endpoints

### Health (`/api/`)
- `GET /api/message` - Health check, returns "Hello Hono!"
- `GET /api/protected` - Auth test, returns user ID if authenticated

### Todos (`/api/todo`)
- `GET /api/todo` - List todos (query: `limit`, `offset`)
- `POST /api/todo` - Create todo (body: `{ title: string }`)
- `PUT /api/todo/:id` - Update todo (body: `{ title?: string, checkedDate: string | null }`)
- `DELETE /api/todo/:id` - Delete todo

### Export (`/api/todo/export`)
- `POST /api/todo/export` - Generate CSV export, returns download URL
- `GET /api/todo/export/:id` - Download CSV file from R2

## Key Patterns

### API-First Design (Hono)

**All features are built API-first.** The React frontend is just one consumer of the API.

```
┌─────────────────────────────────────────────────────────────┐
│                        Hono API                              │
│                    (src/api/api.ts)                         │
├─────────────────────────────────────────────────────────────┤
│  • All business logic lives here                            │
│  • Zod validation for all inputs                            │
│  • Type exports for consumers                               │
│  • Supports session auth (frontend) + API keys (external)   │
└─────────────────────────────────────────────────────────────┘
          ▲                    ▲                    ▲
          │                    │                    │
    React Router          Mobile App           CLI / Scripts
    (frontend)            (future)             (automation)
```

**Why API-first:**
- Frontend is decoupled from business logic
- External integrations get full functionality
- Testable without UI
- Mobile/CLI clients work out of the box

### Authentication

All API routes use Clerk middleware. Auth works for both frontend sessions and external API keys:

```typescript
function getAuthOrThrow(c: Context) {
  const auth = getAuth(c, { acceptsToken: "api_key" });  // Session OR API key
  if (!auth.isAuthenticated) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  return auth;
}
```

| Client | Auth Method |
|--------|-------------|
| React frontend | Session cookie (automatic) |
| External API | `Authorization: Bearer <api_key>` |

### Database Access
Kysely with D1Dialect for type-safe SQL:

```typescript
import { getDB } from "~/lib/db";

const db = await getDB(c.env);
const todos = await db.selectFrom("todo").selectAll().execute();
```

### Queue Messages
Email notifications sent via Cloudflare Queues:

```typescript
await c.env.EMAIL_QUEUE.send({
  newlyCompletedTodo: { email, title }
} satisfies QueueMessage);
```

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk public key (frontend) | Yes |
| `CLERK_SECRET_KEY` | Clerk secret key (backend) | Yes |
| `RESEND_API_KEY` | Resend email API key | Yes |
| `EMAIL_FROM` | Default email sender address | Yes |

## Cloudflare Bindings

| Binding | Type | Purpose |
|---------|------|---------|
| `TODO_DB` | D1 Database | SQLite database |
| `TODO_EXPORTS` | R2 Bucket | CSV file storage |
| `EMAIL_QUEUE` | Queue | Async email processing |

---

*Last Updated: 2026-01-18*
