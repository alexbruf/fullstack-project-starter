import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { apiFetchContext, envContext } from "~/context";
import { getAuth } from "@clerk/react-router/server";
import { useEffect, useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}



export async function loader({ context, ...rest }: Route.LoaderArgs) {

	const env = context.get(envContext);
	const auth = await getAuth({context, ...rest});
	const apiFetch = context.get(apiFetchContext);

	// example of calling a backend api route from backend-for-frontend
	// since workers cant call each other, it routes via the app
	// passes through clerk auth via headers (automagically)
	// for type safety, we will always just enforce with satisfies types.
	// since this api doesnt take input and returns text output
	// no need for explicit contract
	// its not that deep
	const response = await apiFetch("/api/protected");
	const result = await response.text();

  return { messageFromBff: result, message: env.VALUE_FROM_CLOUDFLARE, userId: auth.userId || null };
}

export default function Home({ loaderData }: Route.ComponentProps) {
	const [state, setState] = useState<string>();
	useEffect(() => {
		(async () => {
			// fetch from  api route from client
			const response = await fetch("/api/protected");
			const result = await response.text();
			setState(result);
		})();
	}, []);
	return <>
	<p> Client Message: {state}</p>
	<p>BFF Message: {loaderData.messageFromBff}</p>
	<p>User ID: {loaderData.userId}</p>
	<Welcome message={loaderData.message} /></>;
}
