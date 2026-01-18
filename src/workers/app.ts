import app from "~/api/app";
import queue from "~/workers/queue";
import cron from "~/workers/cron";
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
