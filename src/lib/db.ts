import { PrismaClient } from "@prisma/client";
import { MOCK } from "./mock/config";
import { createMockDb } from "./mock/engine";

declare global {
  var prisma: PrismaClient | undefined;
}

// Chế độ FE mock (NEXT_PUBLIC_MOCK=1): dùng dữ liệu giả trong bộ nhớ, không kết nối database
export const db: PrismaClient = MOCK
  ? (createMockDb() as unknown as PrismaClient)
  : globalThis.prisma || new PrismaClient();

if (!MOCK && process.env.NODE_ENV !== "production") globalThis.prisma = db;
