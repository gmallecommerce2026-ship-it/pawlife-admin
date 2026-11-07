// src/actions/menu.ts
"use server";

import { db } from "@/lib/db";

// Định nghĩa kiểu dữ liệu trả về cho Frontend dễ sử dụng
export type MenuCategory = {
  id: number;
  name: string;
  imageUrl: string | null;
  products: MenuProduct[];
};

export type MenuProduct = {
  id: number;
  name: string;
  basePrice: number; // Đã convert từ Decimal
  imageUrl: string | null;
  description: string | null;
  isAvailable: boolean;
  options: MenuProductOption[];
};

export type MenuProductOption = {
  id: number;
  groupId: number;
  groupName: string;
  isRequired: boolean;
  isMultiple: boolean;
  values: MenuOptionValue[];
};

export type MenuOptionValue = {
  id: number;
  name: string;
  priceAdjustment: number; // Đã convert từ Decimal
};

export async function getMenuData(): Promise<MenuCategory[]> {
  try {
    const categories = await db.category.findMany({
      orderBy: {
        displayOrder: "asc",
      },
      include: {
        products: {
          where: {
            isAvailable: true, // Chỉ lấy sản phẩm đang mở bán
          },
          include: {
            productOptions: {
              include: {
                optionGroup: {
                  include: {
                    optionValues: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Transform dữ liệu: Convert Decimal sang number và làm sạch cấu trúc
    const serializedData: MenuCategory[] = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      imageUrl: cat.imageUrl,
      products: cat.products.map((prod) => ({
        id: prod.id,
        name: prod.name,
        basePrice: Number(prod.basePrice), // Convert Decimal -> Number
        imageUrl: prod.imageUrl,
        description: prod.description,
        isAvailable: prod.isAvailable,
        // Làm phẳng cấu trúc productOption -> optionGroup để dễ dùng ở FE
        options: prod.productOptions.map((po) => ({
          id: po.id, // ID của bảng trung gian
          groupId: po.optionGroup.id,
          groupName: po.optionGroup.name,
          isRequired: po.optionGroup.isRequired,
          isMultiple: po.optionGroup.isMultiple,
          values: po.optionGroup.optionValues.map((val) => ({
            id: val.id,
            name: val.name,
            priceAdjustment: Number(val.priceAdjustment), // Convert Decimal -> Number
          })),
        })),
      })),
    }));

    return serializedData;
  } catch (error) {
    console.error("Error fetching menu data:", error);
    return [];
  }
}