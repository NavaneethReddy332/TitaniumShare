import { sql } from "drizzle-orm";
import {
  index,
  sqliteTable,
  text,
  integer,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: integer("expire", { mode: "timestamp" }).notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash"),
  username: text("username"),
  profileImageUrl: text("profile_image_url"),
  provider: text("provider").default("local"),
  providerId: text("provider_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
