# Fullstack Project Starter

A modern fullstack Todo application demonstrating best practices with Cloudflare Workers, React Router v7, and edge-first architecture.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, React Router v7 (SSR), Tailwind CSS v4, shadcn/ui |
| **Backend** | Hono on Cloudflare Workers |
| **Database** | Cloudflare D1 (SQLite) via Kysely |
| **Storage** | Cloudflare R2 |
| **Queue** | Cloudflare Queues |
| **Auth** | Clerk |
| **Email** | Resend |
| **Build** | Vite, Bun |

## Features

- **Authentication** - User signup/login with Clerk
- **Todo CRUD** - Create, read, update, delete todos
- **Inline Editing** - Click to edit todo titles
- **Completion Tracking** - Mark todos as complete with visual feedback
- **Email Notifications** - Automatic email when a todo is completed (Queue example)
- **Daily Digest** - Scheduled daily email summary (Cron example)
- **CSV Export** - Export todos to CSV file stored in R2 (Object storage example)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- [Cloudflare account](https://dash.cloudflare.com/) with Workers paid plan (for Queues)
- [Clerk account](https://clerk.com/) for authentication
- [Resend account](https://resend.com/) for transactional email

### 1. Install Dependencies

```bash
bun install
```

### 2. Set Up Cloudflare Resources

Create the D1 database:
```bash
wrangler d1 create "todo-db"
```

Create the R2 bucket:
```bash
wrangler r2 bucket create "todo-exports"
```

Create the Queue:
```bash
wrangler queues create "email-queue"
```

Update `wrangler.jsonc` with your D1 database ID from the output above.

### 3. Run Database Migrations

```bash
bun run migrations:apply --local   # For local development
bun run migrations:apply --remote  # For production
```

### 4. Configure Environment Variables

Create a `.dev.vars` file for local development:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
RESEND_API_KEY=re_...
EMAIL_FROM=Todo App <noreply@yourdomain.com>
```

### 5. Start Development Server

```bash
bun run dev
```

The app will be available at `http://localhost:5173`.

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run deploy` | Build and deploy to Cloudflare |
| `bun run typecheck` | Run TypeScript type checking |
| `bun run lint` | Run Biome linter |
| `bun run format` | Format code with Biome |
| `bun run test` | Run tests |
| `bun run precommit` | Run all quality checks |

## Project Structure

```
src/
├── api/           # Hono API routes
├── components/    # React components (shadcn/ui)
├── emails/        # React Email templates
├── lib/           # Utilities and database setup
├── routes/        # React Router pages
└── workers/       # Cloudflare Worker entry points
    ├── app.ts     # Main worker
    ├── cron.ts    # Scheduled jobs
    └── queue.tsx  # Queue consumer
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/message` | Health check |
| GET | `/api/todo` | List todos (paginated) |
| POST | `/api/todo` | Create todo |
| PUT | `/api/todo/:id` | Update todo |
| DELETE | `/api/todo/:id` | Delete todo |
| POST | `/api/todo/export` | Export todos to CSV |
| GET | `/api/todo/export/:id` | Download exported CSV |

## Documentation

See the `docs/` folder for detailed documentation:

- [Architecture](docs/ARCHITECTURE.md) - System design and data flow
- [Contributing](docs/CONTRIBUTING.md) - Code standards and workflow
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

## License

MIT
