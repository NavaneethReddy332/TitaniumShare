import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error("TURSO_DATABASE_URL must be set. Did you forget to add your Turso credentials?");
}

if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error("TURSO_AUTH_TOKEN must be set. Did you forget to add your Turso credentials?");
}

export const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
