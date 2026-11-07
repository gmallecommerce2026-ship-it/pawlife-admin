// src/actions/categories.ts
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Lấy danh sách sản phẩm để hiển thị trong select box
export async function getProductsForSelection() {
  try {
    const products = await db.product.findMany({
      select: {
        id: true,
        name: true,
        category: {
          select: { name: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

// Hàm tạo danh mục
export async function createCategory(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const displayOrder = parseInt(formData.get("displayOrder") as string) || 0;
    
    // Lấy danh sách ID sản phẩm được chọn (dạng string "1,2,3" hoặc array)
    // Lưu ý: FormData.getAll trả về array các giá trị nếu có nhiều input cùng name
    const productIds = formData.getAll("productIds").map((id) => parseInt(id as string));

    if (!name) {
      return { error: "Tên danh mục không được để trống" };
    }

    await db.category.create({
      data: {
        name,
        imageUrl,
        displayOrder,
        // Liên kết các sản phẩm đã chọn vào danh mục này
        // (Prisma sẽ tự động cập nhật categoryId của các sản phẩm này sang ID danh mục mới)
        products: {
          connect: productIds.map((id) => ({ id })),
        },
      },
    });

    revalidatePath("/admin/categories");
  } catch (error) {
    console.error("Create category error:", error);
    return { error: "Có lỗi xảy ra khi tạo danh mục" };
  }

  // Redirect phải để ngoài try/catch trong Server Actions của Next.js
  redirect("/admin/categories");
}

export async function updateCategory(formData: FormData) {
  try {
    const id = parseInt(formData.get("id") as string);
    const name = formData.get("name") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const displayOrder = parseInt(formData.get("displayOrder") as string) || 0;

    if (!id || !name) return { error: "Dữ liệu không hợp lệ" };

    await db.category.update({
      where: { id },
      data: {
        name,
        imageUrl,
        displayOrder,
      },
    });

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    console.error("Update category error:", error);
    return { error: "Lỗi khi cập nhật danh mục" };
  }
}

// --- MỚI: Hàm Delete Danh mục ---
export async function deleteCategory(id: number) {
  try {
    // Kiểm tra xem danh mục có chứa sản phẩm không
    const productCount = await db.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      return { error: `Không thể xóa: Danh mục này đang chứa ${productCount} sản phẩm.` };
    }

    await db.category.delete({
      where: { id },
    });

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    console.error("Delete category error:", error);
    return { error: "Lỗi khi xóa danh mục" };
  }
}