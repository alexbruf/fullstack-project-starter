import { createClerkClient, type ClerkClient } from "@clerk/backend";
import type { QueueMessage } from "./queue";

export default {
  async scheduled(_controller, env) {
    console.log("Cron job executed at", new Date().toISOString());
    // go through each user and dispatch a queue item for each user to send daily email
    const clerk = createClerkClient({
      secretKey: env.CLERK_SECRET_KEY,
      publishableKey: env.VITE_CLERK_PUBLISHABLE_KEY,
    });
    const count = await clerk.users.getCount();
    for (let i = 0; i < count; i += 100) {
      const users = await clerk.users.getUserList({ limit: 100, offset: i });
      await env.EMAIL_QUEUE.sendBatch(
        users.data
          .filter((user) => user.primaryEmailAddress?.emailAddress)
          .map((user) => ({
            body: {
              dailyEmail: {
                userId: user.id,
                email: user.primaryEmailAddress?.emailAddress!,
              },
            } satisfies QueueMessage,
          })),
      );
    }
  },
} satisfies ExportedHandler<Env>;
