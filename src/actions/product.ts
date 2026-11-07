// src/actions/product.ts
"use server";

import { db } from "@/lib/db";
import { ProductDetail } from "@/types/product";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
export interface ProductAdminResponse {
  products: (ProductDetail & { status: "active" | "out_of_stock"; categoryName: string })[];
  total: number;
  totalPages: number;
}

export async function getProductsForAdmin(
  page: number = 1,
  pageSize: number = 10,
  query: string = "",
  status: "all" | "active" | "out_of_stock" = "all",
  categoryId?: number
): Promise<ProductAdminResponse> {
  try {
    const skip = (page - 1) * pageSize;

    // Xây dựng điều kiện lọc (Where clause)
    const where: Prisma.ProductWhereInput = {
      AND: [
        // Tìm kiếm theo tên (không phân biệt hoa thường)
        query ? { name: { contains: query } } : {}, // Lưu ý: PostgreSQL mặc định case-sensitive, MySQL thì không.
        // Lọc theo trạng thái
        status !== "all"
          ? { isAvailable: status === "active" }
          : {},
        // Lọc theo danh mục
        categoryId ? { categoryId } : {},
      ],
    };

    // Chạy song song: đếm tổng số bản ghi và lấy dữ liệu trang hiện tại
    const [total, products] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { id: 'desc' }, // Sản phẩm mới nhất lên đầu
        include: {
          category: true,
          productOptions: {
            include: {
              optionGroup: { include: { optionValues: true } },
            },
          },
        },
      }),
    ]);

    // Map dữ liệu sang format Frontend cần
    const mappedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description || "",
      basePrice: Number(product.basePrice), // QUAN TRỌNG: Convert Decimal -> Number
      imageUrl: product.imageUrl || "/images/placeholder-food.jpg",
      categoryId: product.categoryId,
      categoryName: product.category?.name || "Chưa phân loại",
      status: product.isAvailable ? "active" : "out_of_stock",
      optionGroups: [], 
    })) as any;

    return {
      products: mappedProducts,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error("Error fetching admin products:", error);
    return { products: [], total: 0, totalPages: 0 };
  }
}

// Hàm lấy danh sách Category để đổ vào dropdown lọc
export async function getCategoriesForFilter() {
    try {
        return await db.category.findMany({
            select: { id: true, name: true }
        });
    } catch (error) {
        return [];
    }
}
export async function getBestSellingProducts(limit: number = 4): Promise<ProductDetail[]> {
  try {
    const products = await db.product.findMany({
      take: limit,
      // Logic: Sắp xếp theo số lượng orderItems (bán chạy nhất)
      // Nếu chưa có quan hệ orderItems, hãy đổi thành: orderBy: { createdAt: 'desc' }
      orderBy: {
        orderItems: {
          _count: 'desc'
        }
      },
      include: {
        category: true,
        productOptions: {
          include: {
            optionGroup: { include: { optionValues: true } },
          },
        },
      },
    });

    // Transform dữ liệu cho khớp với type ProductDetail
    return products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description || "",
      basePrice: Number(product.basePrice),
      imageUrl: product.imageUrl || "",
      categoryId: product.categoryId,
      isAvailable: product.isAvailable,
      optionGroups: product.productOptions.map((po) => ({
        id: po.optionGroup.id,
        name: po.optionGroup.name,
        isMultiple: po.optionGroup.isMultiple,
        isRequired: po.optionGroup.isRequired,
        optionValues: po.optionGroup.optionValues.map((val) => ({
          id: val.id,
          name: val.name,
          priceAdjustment: Number(val.priceAdjustment),
        })),
      })),
    }));
  } catch (error) {
    console.error("Error fetching best sellers:", error);
    return [];
  }
}

export interface CreateProductInput {
  name: string;
  basePrice: number;
  categoryId: number;
  description: string;
  imageUrl?: string;
  isAvailable?: boolean;
  optionGroups: {
    title: string;
    isRequired: boolean;
    type: 'single' | 'multiple';
    items: {
      name: string;
      price: number;
    }[];
  }[];
}

export async function createProduct(data: CreateProductInput) {
  try {
    // Sử dụng transaction để đảm bảo toàn vẹn dữ liệu
    // 1. Tạo Product
    // 2. Tạo các OptionGroup mới (theo UI này là tạo mới)
    // 3. Liên kết Product với OptionGroup qua bảng ProductOption
    
    const newProduct = await db.$transaction(async (tx) => {
      // 1. Tạo sản phẩm
      const product = await tx.product.create({
        data: {
          name: data.name,
          basePrice: data.basePrice,
          categoryId: data.categoryId,
          description: data.description,
          imageUrl: data.imageUrl,
          isAvailable: true,
        },
      });

      // 2. Xử lý các nhóm tùy chọn
      if (data.optionGroups && data.optionGroups.length > 0) {
        for (const group of data.optionGroups) {
          // Tạo OptionGroup và OptionValue cùng lúc
          const newGroup = await tx.optionGroup.create({
            data: {
              name: group.title,
              isRequired: group.isRequired,
              isMultiple: group.type === 'multiple',
              optionValues: {
                create: group.items.map((item) => ({
                  name: item.name,
                  priceAdjustment: item.price,
                })),
              },
            },
          });

          // Liên kết Product với OptionGroup
          await tx.productOption.create({
            data: {
              productId: product.id,
              optionGroupId: newGroup.id,
            },
          });
        }
      }

      return product;
    });

    return { success: true, data: newProduct };
  } catch (error) {
    console.error("Error creating product:", error);
    return { success: false, error: "Failed to create product" };
  }
}

export async function getProductById(id: number): Promise<ProductDetail | null> {
  try {
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
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
    });

    if (!product) return null;

    // Transform dữ liệu từ Prisma sang cấu trúc Frontend (ProductDetail)
    const productDetail: ProductDetail = {
      id: product.id,
      name: product.name,
      description: product.description || "",
      basePrice: Number(product.basePrice), // Convert Decimal -> Number
      imageUrl: product.imageUrl || "",
      categoryId: product.categoryId,
      isAvailable: product.isAvailable,
      // Map quan hệ nhiều-nhiều (product_option) về danh sách OptionGroup phẳng
      optionGroups: product.productOptions.map((po) => ({
        id: po.optionGroup.id,
        name: po.optionGroup.name,
        isMultiple: po.optionGroup.isMultiple,
        isRequired: po.optionGroup.isRequired,
        optionValues: po.optionGroup.optionValues.map((val) => ({
          id: val.id,
          name: val.name,
          priceAdjustment: Number(val.priceAdjustment),
        })),
      })),
    };

    return productDetail;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function deleteProduct(id: number) {
  try {
    // Xóa sản phẩm (Prisma sẽ tự handle cascade nếu cấu hình onDelete: Cascade ở schema)
    // Nếu chưa config cascade, phải xóa productOption trước. 
    // Theo schema bạn gửi: ProductOption có onDelete: Cascade -> ỔN.
    
    await db.product.delete({
      where: { id },
    });

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: "Không thể xóa sản phẩm này." };
  }
}

// 2. Action Tạo danh mục nhanh
export async function createQuickCategory(name: string) {
  try {
    const newCategory = await db.category.create({
      data: { name, displayOrder: 0 }
    });
    return { success: true, data: newCategory };
  } catch (error) {
    return { success: false, error: "Lỗi tạo danh mục" };
  }
}

// 3. Action Cập nhật sản phẩm
export async function updateProduct(id: number, data: CreateProductInput) {
  try {
    const updatedProduct = await db.$transaction(async (tx) => {
      // B1: Update thông tin cơ bản
      const product = await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          basePrice: data.basePrice,
          categoryId: data.categoryId,
          isAvailable: data.isAvailable,
          description: data.description,
          imageUrl: data.imageUrl,
        },
      });

      // B2: Xử lý OptionGroups (Cách đơn giản nhất: Xóa cũ -> Tạo mới)
      // Lưu ý: Logic này giả định OptionGroup thuộc riêng về Product này.
      
      // Tìm các liên kết cũ
      const oldLinks = await tx.productOption.findMany({
        where: { productId: id },
        select: { optionGroupId: true }
      });
      const oldGroupIds = oldLinks.map(l => l.optionGroupId);

      // Xóa liên kết
      await tx.productOption.deleteMany({
        where: { productId: id }
      });

      // (Tuỳ chọn) Xóa OptionGroup cũ để tránh rác DB nếu chúng không dùng chung
      if (oldGroupIds.length > 0) {
        await tx.optionGroup.deleteMany({
            where: { id: { in: oldGroupIds } }
        });
      }

      // B3: Tạo lại OptionGroups mới từ Form gửi lên
      if (data.optionGroups && data.optionGroups.length > 0) {
        for (const group of data.optionGroups) {
          const newGroup = await tx.optionGroup.create({
            data: {
              name: group.title,
              isRequired: group.isRequired,
              isMultiple: group.type === 'multiple',
              optionValues: {
                create: group.items.map((item) => ({
                  name: item.name,
                  priceAdjustment: item.price,
                })),
              },
            },
          });

          await tx.productOption.create({
            data: {
              productId: product.id,
              optionGroupId: newGroup.id,
            },
          });
        }
      }

      return product;
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    return { success: true, data: updatedProduct };
  } catch (error) {
    console.error("Error updating product:", error);
    return { success: false, error: "Failed to update product" };
  }
}