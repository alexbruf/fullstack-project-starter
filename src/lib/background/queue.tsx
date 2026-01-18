import type { Kysely } from "kysely";
import { Resend } from "resend";
import z from "zod";
import { DailyEmail } from "~/emails/daily-email";
import { EmailTemplate } from "~/emails/new-todo-complete";
import { type Database, getDB } from "../db";

export const newlyCompletedTodoMessageSchema = z.object({
  email: z.email(),
  title: z.string().min(1).max(255),
});

export const dailyEmailMessageSchema = z.object({
  userId: z.string(),
  email: z.email(),
});

const dateFormatter = Intl.DateTimeFormat("en-US");

function aDayAgo() {
  const now = Date.now();
  const aday = 24 * 60 * 60 * 1000;
  return new Date(now - aday);
}

export class QueueManager {
  private resend: Resend;
  private dbProm: Promise<Kysely<Database>>;
  private fromEmail: string;

  constructor(env: Env) {
    this.resend = new Resend(env.RESEND_API_KEY);
    this.dbProm = getDB(env);
    this.fromEmail = env.EMAIL_FROM || "Todo App <no-reply@example.com>";
  }

  async newlyCompletedTodo(todo: z.infer<typeof newlyCompletedTodoMessageSchema>) {
    const { error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: [todo.email],
      subject: "New Todo Completed!",
      react: <EmailTemplate title={todo.title} />,
    });
    if (error) console.log("Error sending email:", error);
  }

  async handleDailyEmail(user: z.infer<typeof dailyEmailMessageSchema>) {
    // get all Todos last 24 hours for user
    const db = await this.dbProm;
    const todos = await db
      .selectFrom("todo")
      .where("todo.user_id", "=", user.userId)
      .where("completed_date", ">", aDayAgo().toISOString())
      .select("title")
      .execute();

    const { error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: [user.email],
      subject: `Daily Summary of Completed Todos: ${dateFormatter.format(new Date())}`,
      react: <DailyEmail todos={todos.map((t) => t.title)} />,
    });
    if (error) console.log("Error sending daily email:", error);
  }
}
