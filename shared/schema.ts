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

export const files = sqliteTable("files", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  originalName: text("original_name").notNull(),
  storageKey: text("storage_key").notNull(),
  size: integer("size").notNull(),
  contentType: text("content_type"),
  shareCode: text("share_code").unique(),
  password: text("password"),
  downloadCount: integer("download_count").default(0),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const feedback = sqliteTable("feedback", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
});

export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  downloadCount: true,
  createdAt: true,
});

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

export const deletedAccounts = sqliteTable("deleted_accounts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  deletedAt: integer("deleted_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  banExpiresAt: integer("ban_expires_at", { mode: "timestamp" }).notNull(),
});

export type DeletedAccount = typeof deletedAccounts.$inferSelect;

// P2P Transfer rooms for WebRTC signaling
export const p2pRooms = sqliteTable("p2p_rooms", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  roomCode: text("room_code").unique().notNull(),
  hostId: text("host_id").notNull(),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  status: text("status").default("waiting"), // waiting, connected, transferring, completed
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
});

export const insertP2PRoomSchema = createInsertSchema(p2pRooms).omit({
  id: true,
  createdAt: true,
});

export type InsertP2PRoom = z.infer<typeof insertP2PRoomSchema>;
export type P2PRoom = typeof p2pRooms.$inferSelect;
