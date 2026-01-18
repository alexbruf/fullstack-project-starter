import { env } from "cloudflare:workers";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { type Context, Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { stream } from "hono/streaming";
import type { Selectable } from "kysely";
import { z } from "zod";
import { getDB, type TodoTable } from "~/lib/db";
import type { QueueMessage } from "~/workers/queue";

const api = new Hono<{ Bindings: Env }>();

api.use(
  "*",
  clerkMiddleware({
    publishableKey: env.VITE_CLERK_PUBLISHABLE_KEY,
    secretKey: env.CLERK_SECRET_KEY,
  }),
);

async function getUserOrThrow(c: Context) {
  const auth = getAuth(c, { acceptsToken: "api_key" });
  const clerkClient = c.get("clerk");
  if (!auth.isAuthenticated || !auth.userId) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const user = await clerkClient.users.getUser(auth.userId);
  return user;
}

function getAuthOrThrow(c: Context) {
  const auth = getAuth(c, { acceptsToken: "api_key" });
  if (!auth.isAuthenticated) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  return auth;
}

api.get("/message", (c) => {
  return c.text("Hello Hono!");
});

api.get("/protected", (c) => {
  const user = getAuth(c, { acceptsToken: "api_key" });
  if (!user.isAuthenticated) {
    return c.text("Unauthorized", 401);
  }
  return c.text(
    `This is a protected route. User ID: ${user.userId} is api key?: ${user.tokenType}`,
  );
});

// list todos
export type ListTodosResponse = { todos: Selectable<TodoTable>[] };
api.get("/todo", async (c) => {
  const auth = getAuthOrThrow(c);
  const db = await getDB(c.env);
  const limitParam = parseInt(c.req.query("limit") ?? "20", 10);
  const offsetParam = parseInt(c.req.query("offset") ?? "0", 10);
  const limit = Number.isNaN(limitParam) || limitParam < 1 ? 20 : Math.min(limitParam, 100);
  const offset = Number.isNaN(offsetParam) || offsetParam < 0 ? 0 : offsetParam;
  const todos = await db
    .selectFrom("todo")
    .selectAll()
    .where("todo.user_id", "=", auth.userId)
    .limit(limit)
    .offset(offset)
    .orderBy("created_at", "asc")
    .execute();

  return c.json({ todos });
});

// create todo
const createTodoSchema = z.object({
  title: z.string().min(1).max(255),
});
export type CreateTodoRequest = z.infer<typeof createTodoSchema>;
api.post("/todo", async (c) => {
  const auth = getAuthOrThrow(c);
  const db = await getDB(c.env);
  const body = await c.req.json();
  const parsed = createTodoSchema.safeParse(body);
  if (parsed.error) return c.json({ error: parsed.error.message }, 400);

  await db.insertInto("todo").values({ user_id: auth.userId!, title: parsed.data.title }).execute();
  return c.json({ success: true }, 201);
});

const updateTodoSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  checkedDate: z.string().or(z.null()),
});
export type UpdateTodoRequest = z.infer<typeof updateTodoSchema>;
// update todo
api.put("/todo/:id", async (c) => {
  const auth = getAuthOrThrow(c);
  const user = await getUserOrThrow(c);
  const email = user.primaryEmailAddress?.emailAddress;
  if (!email) return c.json({ error: "No email associated with user" }, 400);
  const db = await getDB(c.env);
  const body = await c.req.json();
  const parsed = updateTodoSchema.safeParse(body);
  if (parsed.error) return c.json({ error: parsed.error.message }, 400);

  const isCheckedPreviously = await db
    .selectFrom("todo")
    .where("id", "=", parseInt(c.req.param("id"), 10))
    .select(["completed_date", "title"])
    .executeTakeFirst();
  const isNewlyChecked =
    isCheckedPreviously?.completed_date === null && parsed.data.checkedDate !== null;
  await db
    .updateTable("todo")
    .set({
      title: parsed.data.title,
      completed_date: parsed.data.checkedDate,
    })
    .where("id", "=", parseInt(c.req.param("id"), 10))
    .where("user_id", "=", auth.userId!)
    .execute();

  if (isNewlyChecked) {
    await c.env.EMAIL_QUEUE.send({
      newlyCompletedTodo: {
        email,
        title: parsed.data.title || isCheckedPreviously?.title || "",
      },
    } satisfies QueueMessage);
  }

  return c.json({ success: true });
});

// delete todo
api.delete("/todo/:id", async (c) => {
  const auth = getAuthOrThrow(c);
  const db = await getDB(c.env);

  const resp = await db
    .deleteFrom("todo")
    .where("id", "=", parseInt(c.req.param("id"), 10))
    .where("user_id", "=", auth.userId!)
    .executeTakeFirst();
  return c.json({ success: !!resp.numDeletedRows });
});

api.get("/todo/export/:id", async (c) => {
  getAuthOrThrow(c); // Ensure user is authenticated
  const obj = await c.env.TODO_EXPORTS.get(c.req.param("id"));
  if (!obj) return c.text("Not Found", 404);
  const contentLength = obj.size;
  c.header("Content-Disposition", `attachment; filename="${c.req.param("id")}"`);
  c.header("Content-Type", "application/octet-stream");
  c.header("Content-Length", contentLength.toString());
  return stream(c, async (stream) => {
    await stream.pipe(obj.body);
  });
});

// export todo to r2
api.post("/todo/export", async (c) => {
  // download and upload to r2
  const auth = getAuthOrThrow(c);
  const db = await getDB(c.env);

  const resp = await db
    .selectFrom("todo")
    .selectAll()
    .where("user_id", "=", auth.userId!)
    .execute();

  // lets make it a csv now
  const key = `${crypto.randomUUID()}.csv`;
  const upload = await c.env.TODO_EXPORTS.createMultipartUpload(key);

  const part = await upload.uploadPart(
    1,
    new Blob(
      [
        "id,user_id,title,created_at,completed_date\n" +
          resp
            .map(
              (t) =>
                `${t.id},${t.user_id},"${t.title.replace(/"/g, '""')}",${t.created_at},${t.completed_date ? t.completed_date : ""}`,
            )
            .join("\n"),
      ],
      { type: "text/csv" },
    ),
  );

  await upload.complete([part]);
  const url = new URL(`/api/todo/export/${key}`, c.req.url);
  return c.json({ url: url.toString() });
});

export default api;
