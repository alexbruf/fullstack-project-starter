import z from "zod";
import {
  dailyEmailMessageSchema,
  newlyCompletedTodoMessageSchema,
  QueueManager,
} from "~/lib/background/queue";

export const queueMessageSchema = z.object({
  newlyCompletedTodo: newlyCompletedTodoMessageSchema.optional(),
  dailyEmail: dailyEmailMessageSchema.optional(),
});
export type QueueMessage = z.infer<typeof queueMessageSchema>;

export default {
  async queue(batch, env, _ctx) {
    const qm = new QueueManager(env);
    for (const message of batch.messages) {
      const parseResult = queueMessageSchema.safeParse(message.body);
      if (!parseResult.success) {
        console.log("Could not parse message:", parseResult.error);
        message.retry();
        continue;
      }
      if (parseResult.data.newlyCompletedTodo) {
        const todo = parseResult.data.newlyCompletedTodo;
        await qm.newlyCompletedTodo(todo);
      }
      if (parseResult.data.dailyEmail) {
        const dailyEmail = parseResult.data.dailyEmail;
        await qm.handleDailyEmail(dailyEmail);
      }
    }
  },
} satisfies ExportedHandler<Env>;
