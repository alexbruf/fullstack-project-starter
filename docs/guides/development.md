# Development Guide

Step-by-step guides for common development tasks. For coding standards, testing, and git workflow, see [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## Adding a Database Field/Table

1. **Create migration:**
   ```bash
   bun run migrations:create add-field-to-todo
   ```

2. **Edit the migration file** in `migrations/`:
   ```sql
   -- migrations/0003_add-field-to-todo.sql
   ALTER TABLE todo ADD COLUMN priority INTEGER DEFAULT 0;
   ```

3. **Update the type definition** in `src/lib/db.ts`:
   ```typescript
   export interface TodoTable {
     id: Generated<number>;
     user_id: string;
     title: string;
     priority: number;  // Add new field
     // ...
   }
   ```

4. **Apply migration:**
   ```bash
   bun run migrations:apply --local   # Local dev
   bun run migrations:apply --remote  # Production
   ```

5. **Update inventory** if adding new tables → `tests/module-inventory.json`

---

## Adding an API Route (Hono)

**Philosophy: API-First Design**

Every feature in this app is built API-first using Hono. The frontend is just one consumer of the API. This means:
- All business logic lives in API routes, not React components
- External clients (mobile apps, CLI tools, integrations) can do everything the UI can
- Authentication supports both session cookies (frontend) and API keys (external clients)

**When to create an API route:**
- Any data mutation (create, update, delete)
- Any data query that could be useful outside the UI
- Anything a user might want to automate or integrate with

### Step-by-Step

1. **Add route to `src/api/api.ts`** using Hono:

   ```typescript
   import { z } from "zod";

   // Define request schema with Zod
   const createStatsExportSchema = z.object({
     format: z.enum(["csv", "json"]).default("json"),
   });
   export type CreateStatsExportRequest = z.infer<typeof createStatsExportSchema>;

   // Define response type
   export type TodoStatsResponse = { stats: { total: number; completed: number } };

   // GET /api/todo/stats - Get todo statistics
   api.get("/todo/stats", async (c) => {
     const auth = getAuthOrThrow(c);  // Works with session OR API key
     const db = await getDB(c.env);

     const stats = await db
       .selectFrom("todo")
       .select([
         db.fn.count("id").as("total"),
         db.fn.count("completed_date").as("completed"),
       ])
       .where("user_id", "=", auth.userId!)
       .executeTakeFirst();

     return c.json({ stats });
   });
   ```

2. **Follow the API patterns:**

   | Pattern | Example | Purpose |
   |---------|---------|---------|
   | Auth helper | `getAuthOrThrow(c)` | Supports session + API keys |
   | Zod validation | `schema.safeParse(body)` | Type-safe request validation |
   | Type exports | `export type XResponse` | Frontend type safety |
   | JSON responses | `c.json({ data })` | Consistent API format |
   | HTTP status codes | `c.json({ error }, 400)` | RESTful error handling |

3. **Update endpoint inventory** (`tests/endpoint-inventory.json`):
   ```json
   {
     "method": "GET",
     "path": "/api/todo/stats",
     "description": "Get todo statistics for authenticated user"
   }
   ```

4. **Run tests** to verify inventory matches:
   ```bash
   bun run test
   ```

### Authentication

All protected routes use `getAuthOrThrow()` which accepts both:
- **Session cookies** - From frontend (React Router)
- **API keys** - From external clients (Clerk API keys)

```typescript
// This works for BOTH frontend and external API clients
const auth = getAuthOrThrow(c);  // acceptsToken: "api_key" is configured

// If you need user details (email, name, etc.)
const user = await getUserOrThrow(c);
```

External clients authenticate via `Authorization: Bearer <api_key>` header.

---

## Data Fetching Patterns

This project uses **two complementary systems** for data fetching:

1. **React Router** - Route-level data (SSR, navigation, route mutations)
2. **TanStack Query** - Component-level data (cache, polling, dynamic UI)

**Rule of thumb:** If data is tied to a route, use React Router. If data is tied to a component's lifecycle, use TanStack Query.

| Pattern | When to Use | Example |
|---------|-------------|---------|
| **loader** | Initial page data, SSR, SEO | Todo list on page load |
| **clientLoader** | Client-side navigation, skip server | Cached data, external APIs |
| **fetcher.Form** | Mutations that should revalidate routes | Create/update/delete with route refresh |
| **useQuery** | Component data, caching, polling | Search, notifications, dashboards |
| **useMutation** | Mutations with cache control | Optimistic updates, complex mutations |

---

### React Router Patterns (Route-Level)

#### Pattern 1: Server Loader (SSR)

Use `loader` for initial page data. Runs on server during SSR.

```typescript
// src/routes/home/page.tsx
import type { Route } from "./+types/page";

export async function loader({ request }: Route.LoaderArgs) {
  const response = await fetch(`${new URL(request.url).origin}/api/todo`);
  return response.json();
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const { todos } = loaderData;
  return <TodoList todos={todos} />;
}
```

**When to use:**
- Initial page data needed for render
- SEO-critical content
- Data that should be ready before paint

#### Pattern 2: Client Loader (Skip Server Hop)

Use `clientLoader` for client-side navigations. Can call `serverLoader()` or fetch directly.

```typescript
// src/routes/products/page.tsx
import type { Route } from "./+types/page";

// Server loader for initial SSR
export async function loader({ request }: Route.LoaderArgs) {
  return fetchFromDb(request);
}

// Client loader for subsequent navigations (skips server)
export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  // Option A: Call server loader
  return serverLoader();

  // Option B: Fetch directly from client (skip server hop)
  // return fetch("/api/products").then(r => r.json());
}
```

**When to use:**
- Client-side navigation optimization
- Caching strategies
- Direct API calls from browser (skip BFF)

#### Pattern 3: Client-Only Loader

For data that should only load on the client (no SSR).

```typescript
// src/routes/dashboard/page.tsx
import type { Route } from "./+types/page";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const res = await fetch("/api/dashboard/stats");
  return res.json();
}
clientLoader.hydrate = true; // Run during hydration

// Show while clientLoader is running
export function HydrateFallback() {
  return <DashboardSkeleton />;
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  return <Stats data={loaderData} />;
}
```

**When to use:**
- User-specific data not needed for SSR
- Data from browser-only APIs
- Reduced server load

#### Pattern 4: Fetcher for Route Mutations

Use `fetcher.Form` when mutations should trigger React Router revalidation.

```typescript
import { useFetcher } from "react-router";

function CreateTodo() {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";

  return (
    <fetcher.Form method="post" action="/api/todo">
      <input name="title" required />
      <button disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create"}
      </button>
    </fetcher.Form>
  );
}
```

**When to use:**
- Mutations where route loaders should re-run after success
- Simple form submissions
- When you want React Router to manage the optimistic/pending state

**When NOT to use:**
- Complex optimistic updates (use `useMutation` instead)
- When you need fine-grained cache control
- Mutations that don't affect route data

---

### TanStack Query Patterns (Component-Level)

TanStack Query is the primary choice for client-side data fetching outside of route loaders.

#### Pattern 5: useQuery for Data Loading

Use `useQuery` for component-level data fetching with caching.

```typescript
import { useQuery } from "@tanstack/react-query";

// Search with debounced query
function SearchResults({ query }: { query: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["search", query],
    queryFn: () => fetch(`/api/search?q=${query}`).then(r => r.json()),
    enabled: !!query, // Only fetch when query exists
  });

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  return <Results data={data} />;
}

// Polling for notifications
function NotificationBell() {
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetch("/api/notifications").then(r => r.json()),
    refetchInterval: 10000, // Poll every 10 seconds
  });

  return <Bell count={data?.count ?? 0} />;
}

// Dashboard with stale-while-revalidate
function DashboardStats() {
  const { data, isStale } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => fetch("/api/dashboard/stats").then(r => r.json()),
    staleTime: 60000, // Consider fresh for 1 minute
  });

  return (
    <div className={isStale ? "opacity-75" : ""}>
      <Stats data={data} />
    </div>
  );
}
```

**When to use:**
- Search/typeahead
- Polling/real-time updates
- Dashboards and analytics
- Data shared across components (cache)
- Background refetching
- Any client-side data not tied to route navigation

#### Pattern 6: useMutation for Complex Mutations

Use `useMutation` when you need optimistic updates or cache manipulation.

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

function TodoItem({ todo }: { todo: Todo }) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: (completed: boolean) =>
      fetch(`/api/todo/${todo.id}`, {
        method: "PUT",
        body: JSON.stringify({ completed }),
      }),
    // Optimistic update
    onMutate: async (completed) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const previous = queryClient.getQueryData(["todos"]);
      queryClient.setQueryData(["todos"], (old: Todo[]) =>
        old.map(t => t.id === todo.id ? { ...t, completed } : t)
      );
      return { previous };
    },
    // Rollback on error
    onError: (err, _, context) => {
      queryClient.setQueryData(["todos"], context?.previous);
    },
    // Refetch after success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  return (
    <Checkbox
      checked={todo.completed}
      onChange={() => toggleMutation.mutate(!todo.completed)}
      disabled={toggleMutation.isPending}
    />
  );
}
```

**When to use:**
- Optimistic updates with rollback
- Mutations that update cached data
- Complex mutation flows (multi-step)
- When you need `isPending`, `isError`, `isSuccess` states

---

### Decision Guide

```
Where does this data belong?

ROUTE-LEVEL (use React Router):
├── Initial page data → loader (Pattern 1)
├── Client navigation optimization → clientLoader (Pattern 2)
├── Client-only route data → clientLoader + HydrateFallback (Pattern 3)
└── Simple mutations that should revalidate routes → fetcher.Form (Pattern 4)

COMPONENT-LEVEL (use TanStack Query):
├── Data loading with caching → useQuery (Pattern 5)
├── Polling/real-time updates → useQuery with refetchInterval
├── Search/typeahead → useQuery with enabled flag
├── Mutations with optimistic updates → useMutation (Pattern 6)
└── Mutations with cache control → useMutation
```

**Quick decision:**
- "This data appears when you navigate to the page" → React Router
- "This data appears in a component that could be anywhere" → TanStack Query
- "After this mutation, the whole page should refresh" → fetcher.Form
- "After this mutation, just update this one piece of UI" → useMutation

---

### Anti-Pattern: Raw fetch + useEffect

❌ **Avoid this pattern** - no caching, no loading states, no error handling:

```typescript
// DON'T DO THIS
function BadComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/data")
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <Spinner />;
  return <div>{data}</div>;
}
```

✅ **Do this instead** - use TanStack Query:

```typescript
// DO THIS
function GoodComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ["data"],
    queryFn: () => fetch("/api/data").then(r => r.json()),
  });
  if (isLoading) return <Spinner />;
  return <div>{data}</div>;
}
```

**Why TanStack Query is better:**
- Automatic caching (same query = same data, no refetch)
- Built-in loading/error/success states
- Background refetching (stale-while-revalidate)
- Deduplication (multiple components, one request)
- Retry logic built-in
- DevTools for debugging

---

## Adding a UI Component

1. **Use shadcn/ui CLI** for standard components:
   ```bash
   bunx shadcn@latest add dialog
   ```

2. **For custom components**, create in `src/components/`:
   ```typescript
   // src/components/todo-card.tsx
   export function TodoCard({ todo }: { todo: Todo }) {
     return (
       <Card>
         <CardHeader>{todo.title}</CardHeader>
       </Card>
     );
   }
   ```

3. **Update component inventory** (`tests/component-inventory.json`):
   - UI components go in `components.ui[]`
   - Feature components go in `components.feature[]`

---

## Adding Email Templates

1. **Create template** in `src/emails/`:
   ```tsx
   // src/emails/welcome.tsx
   export function WelcomeEmail({ name }: { name: string }) {
     return (
       <Html>
         <Body>
           <Text>Welcome, {name}!</Text>
         </Body>
       </Html>
     );
   }
   ```

2. **Send via queue** in your API route:
   ```typescript
   await c.env.EMAIL_QUEUE.send({
     welcome: { email: user.email, name: user.name }
   });
   ```

3. **Handle in queue consumer** (`src/workers/queue.tsx`):
   ```typescript
   if ("welcome" in message) {
     await queueManager.sendWelcomeEmail(message.welcome);
   }
   ```

4. **Update module inventory** if adding new email template.

---

*For coding standards, testing requirements, and git workflow, see [CONTRIBUTING.md](../CONTRIBUTING.md).*
