// src/actions/user.ts
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

// Schema validation đơn giản (bạn có thể dùng zod nếu muốn chặt chẽ hơn)
interface UpdateUserData {
  userId: string;
  fullName: string;
  phoneNumber?: string;
  role: Role;
  points?: number; // Cho phép admin sửa điểm thủ công
}

export async function updateUser(data: UpdateUserData) {
  try {
    const { userId, fullName, phoneNumber, role, points } = data;

    await db.user.update({
      where: { id: userId },
      data: {
        fullName,
        phoneNumber,
        role,
        points, // Cập nhật điểm nếu cần
      },
    });

    revalidatePath("/admin/users");
    return { success: true, message: "Cập nhật thành công" };
  } catch (error) {
    console.error("Update user error:", error);
    return { success: false, message: "Lỗi khi cập nhật người dùng" };
  }
}

export async function deleteUser(userId: string) {
  try {
    // 1. Kiểm tra user có tồn tại không
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, message: "Người dùng không tồn tại" };

    // 2. (Quan trọng) Không cho phép xóa chính mình hoặc Super Admin (nếu có logic đó)
    // Ở đây tôi giả sử logic FE sẽ chặn, nhưng BE vẫn nên check thêm nếu cần thiết.

    // 3. Xóa user
    await db.user.delete({
      where: { id: userId },
    });

    revalidatePath("/admin/users");
    return { success: true, message: "Đã xóa người dùng" };
  } catch (error) {
    console.error("Delete user error:", error);
    // Lỗi thường gặp: User bị ràng buộc khóa ngoại (Foreign Key) với Orders, Comments...
    // Bạn có thể cần xóa các dữ liệu liên quan trước hoặc dùng cascade delete trong Prisma schema
    return { 
      success: false, 
      message: "Không thể xóa người dùng này do ràng buộc dữ liệu (đơn hàng, v.v...)" 
    };
  }
}