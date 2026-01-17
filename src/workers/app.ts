import app from "~/api/app";

export default {
  async fetch(request, env, ctx) {
		return app.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
