import {getAuth} from "@clerk/react-router/server";
import type {ActionFunctionArgs, LoaderFunctionArgs} from "react-router";
import {envContext} from "~/context";

async function getClerkAuth(args: LoaderFunctionArgs|ActionFunctionArgs) {
  const env = args.context.get(envContext);
  const auth = await getAuth(args);
  return auth;
}
