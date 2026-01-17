import { Hono } from "hono";

const api = new Hono<{ Bindings: Env }>();


api.get("/message", (c) => {
  return c.text("Hello Hono!");
});


export default api;
