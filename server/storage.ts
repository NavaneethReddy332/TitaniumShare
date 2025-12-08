import {
  users,
  files,
  deletedAccounts,
  type User,
  type InsertUser,
  type File,
  type InsertFile,
  type DeletedAccount,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sum, gt } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  createFile(file: InsertFile): Promise<File>;
  getFile(id: string): Promise<File | undefined>;
  getFileByShareCode(shareCode: string): Promise<File | undefined>;
  getFilesByUserId(userId: string): Promise<File[]>;
  deleteFile(id: string): Promise<void>;
  deleteFilesByUserId(userId: string): Promise<void>;
  incrementDownloadCount(id: string): Promise<void>;
  getUserStorageUsage(userId: string): Promise<number>;
  addDeletedAccount(email: string, banDays: number): Promise<DeletedAccount>;
  getDeletedAccount(email: string): Promise<DeletedAccount | undefined>;
  isEmailBanned(email: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createFile(fileData: InsertFile): Promise<File> {
    const [file] = await db
      .insert(files)
      .values(fileData)
      .returning();
    return file;
  }

  async getFile(id: string): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async getFileByShareCode(shareCode: string): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.shareCode, shareCode));
    return file;
  }

  async getFilesByUserId(userId: string): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(eq(files.userId, userId))
      .orderBy(desc(files.createdAt));
  }

  async deleteFile(id: string): Promise<void> {
    await db.delete(files).where(eq(files.id, id));
  }

  async incrementDownloadCount(id: string): Promise<void> {
    const file = await this.getFile(id);
    if (file) {
      await db
        .update(files)
        .set({ downloadCount: (file.downloadCount || 0) + 1 })
        .where(eq(files.id, id));
    }
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async deleteFilesByUserId(userId: string): Promise<void> {
    await db.delete(files).where(eq(files.userId, userId));
  }

  async getUserStorageUsage(userId: string): Promise<number> {
    const result = await db
      .select({ total: sum(files.size) })
      .from(files)
      .where(eq(files.userId, userId));
    return Number(result[0]?.total) || 0;
  }

  async addDeletedAccount(email: string, banDays: number): Promise<DeletedAccount> {
    const banExpiresAt = new Date();
    banExpiresAt.setDate(banExpiresAt.getDate() + banDays);
    
    const [deleted] = await db
      .insert(deletedAccounts)
      .values({ email, banExpiresAt })
      .returning();
    return deleted;
  }

  async getDeletedAccount(email: string): Promise<DeletedAccount | undefined> {
    const [deleted] = await db
      .select()
      .from(deletedAccounts)
      .where(eq(deletedAccounts.email, email));
    return deleted;
  }

  async isEmailBanned(email: string): Promise<boolean> {
    const [deleted] = await db
      .select()
      .from(deletedAccounts)
      .where(eq(deletedAccounts.email, email));
    
    if (!deleted) return false;
    return deleted.banExpiresAt > new Date();
  }
}

export const storage = new DatabaseStorage();
