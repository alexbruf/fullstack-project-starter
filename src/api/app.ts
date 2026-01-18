import { Hono } from "hono";
import { createRequestHandler, RouterContextProvider } from "react-router";
import { apiFetchContext, envContext } from "~/context";

import api from "./api";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

const app = new Hono<{ Bindings: Env }>();

app.route("/api", api);
app.all("*", async (c) => {
  const contextProvider = new RouterContextProvider();
  const innerFetch: typeof fetch = async (input, init) => {
    let url = input instanceof Request ? input.url : input.toString();
    if (!url.startsWith("http") || url.includes(new URL(c.req.url).hostname)) {
      url = new URL(url, c.req.url).toString();
    }
    let request = input instanceof Request ? input : new Request(url, init);
    const finalRequestUrl = new URL(request.url);
    const isAPIRoute = finalRequestUrl.pathname.startsWith("/api/");
    if (isAPIRoute) {
      // passthrough headers from original request to preserve auth info
      // if headers included in init, those take precedence
      if (!init?.headers) {
        const init2 = init || {};
        init2.headers = new Headers(c.req.raw.headers);
        request = new Request(request, init2);
      }
    }

    return app.fetch(request, c.env, c.executionCtx);
  };
  contextProvider.set(apiFetchContext, innerFetch);
  contextProvider.set(envContext, c.env);
  return requestHandler(c.req.raw, contextProvider);
});

export default app;
