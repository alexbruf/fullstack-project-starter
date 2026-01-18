import app from "~/api/app";
import cron from "~/workers/cron";
import queue from "~/workers/queue";
export default {
  async fetch(request, env, ctx) {
    return app.fetch(request, env, ctx);
  },
  async queue(batch, env, ctx) {
    return queue.queue(batch, env, ctx);
  },
  async scheduled(controller, env) {
    return cron.scheduled(controller, env);
  },
} satisfies ExportedHandler<Env>;
