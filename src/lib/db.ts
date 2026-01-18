import { type ColumnType, type Generated, Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";

export interface TodoTable {
  id: Generated<number>;
  user_id: string;
  title: string;
  created_at: ColumnType<string, string | undefined | null, never>;
  completed_date: ColumnType<string | null, string | undefined | null, string | undefined | null>;
}

export interface Database {
  todo: TodoTable;
}

export async function getDB(_env?: Env) {
  const env = _env! || (await import("cloudflare:workers").then((r) => r.env));
  const db = new Kysely<Database>({
    dialect: new D1Dialect({ database: env.TODO_DB }),
  });
  return db;
}
