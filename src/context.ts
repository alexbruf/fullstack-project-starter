import { createContext } from "react-router";

export const apiFetchContext = createContext<typeof fetch>();
export const envContext = createContext<Env>();
