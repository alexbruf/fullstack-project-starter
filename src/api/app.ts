import {Hono} from "hono";
import {createRequestHandler, RouterContextProvider} from "react-router";
import {envContext} from "~/context";

import api from "./api";

const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"), import.meta.env.MODE);

const app = new Hono<{Bindings : Env}>();

app.route("/api", api);
app.all("*", async (c) => {
  const contextProvider = new RouterContextProvider();
  contextProvider.set(envContext, c.env);
  return requestHandler(c.req.raw, contextProvider);
});

export default app;
