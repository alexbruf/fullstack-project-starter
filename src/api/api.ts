import {clerkMiddleware, getAuth} from "@hono/clerk-auth";
import {Hono} from "hono";
import {env} from "cloudflare:workers";

const api = new Hono<{Bindings : Env}>();

api.use('*', clerkMiddleware({'publishableKey': env.VITE_CLERK_PUBLISHABLE_KEY, 'secretKey': env.CLERK_SECRET_KEY}));
api.get("/message", (c) => { return c.text("Hello Hono!"); });

api.get("/protected", (c) => {
  const user = getAuth(c, {acceptsToken : 'api_key'});
	if(!user.isAuthenticated) {
		return c.text("Unauthorized", 401);
			}
  return c.text("This is a protected route. User ID: " + user.userId +
                " is api key?: " + (user.tokenType));
});
export default api;
