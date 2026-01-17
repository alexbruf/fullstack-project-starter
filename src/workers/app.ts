import { createRequestHandler, RouterContextProvider } from "react-router";
import api from "~/api/app";
import { envContext } from "~/context";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request, env, ctx) {
		const url = new URL(request.url);
		if (url.pathname.startsWith("/api")) {
			return api.fetch(request, env, ctx);
		}

		const contextProvider = new RouterContextProvider();
		contextProvider.set(envContext, env);
    return requestHandler(request, contextProvider);
  },
} satisfies ExportedHandler<Env>;
