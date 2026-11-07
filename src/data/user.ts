// src/data/user.ts
import { db } from "@/lib/db";

export const getUserByEmail = async (userName: string) => {
  try {
    // Sửa param thành userName cho đúng ngữ cảnh DB
    const user = await db.user.findUnique({ where: { userName } });
    return user;
  } catch {
    return null;
  }
};

export const getUserById = async (id: number) => { 
  try {
    const user = await db.user.findUnique({ where: { id } });
    return user;
  } catch {
    return null;
  }
};