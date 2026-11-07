'use server';

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateStoreSettings(formData: FormData) {
  const storeName = formData.get("storeName") as string;
  const hotline = formData.get("hotline") as string;
  const address = formData.get("address") as string;
  const openTime = formData.get("openTime") as string;
  const closeTime = formData.get("closeTime") as string;
  const wifiPass = formData.get("wifiPass") as string;
  const staffNotification = formData.get("staffNotification") as string;

  await db.storeSetting.upsert({
    where: { id: 1 },
    update: {
      storeName, hotline, address, openTime, closeTime, wifiPass, staffNotification
    },
    create: {
      id: 1,
      storeName, hotline, address, openTime, closeTime, wifiPass, staffNotification
    }
  });

  revalidatePath("/admin/settings");
  revalidatePath("/staff/dashboard"); // Cập nhật ngay bên trang staff
  return { success: true };
}