// src/app/(admin)/admin/categories/page.tsx
import React from "react";
import { FiPlus, FiGrid, FiEdit3 } from "react-icons/fi";
import { db } from "@/lib/db";
import Link from "next/link";
import CategoryActions from "./components/category-actions"; // Import component mới

async function getCategories() {
  const categories = await db.category.findMany({
    orderBy: {
      displayOrder: 'asc',
    },
    include: {
      _count: {
        select: { products: true },
      },
      products: {
        take: 4,
        select: { name: true },
      },
    },
  });

  return categories.map((cat) => {
    const productNames = cat.products.map((p) => p.name).join(", ");
    const description = productNames 
      ? productNames + (cat._count.products > 4 ? "..." : "") 
      : "Chưa có sản phẩm";

    return {
      id: cat.id,
      name: cat.name,
      count: cat._count.products,
      description: description,
      imageUrl: cat.imageUrl,
      displayOrder: cat.displayOrder,
    };
  });
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6 font-sans">
       {/* Header */}
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1d150b]">Danh mục món</h2>
          <p className="text-gray-500 text-sm mt-1">Phân loại thực đơn để khách hàng dễ dàng tìm kiếm</p>
        </div>
        <Link href="/admin/categories/create" className="flex items-center gap-2 px-5 py-2.5 bg-[#1d150b] hover:bg-[#3d2e1e] text-white rounded-xl shadow-lg shadow-[#1d150b]/20 transition-all font-medium w-fit">
          <FiPlus size={20} />
          <span>Thêm danh mục</span>
        </Link>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map((cat) => (
            <div key={cat.id} className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-[#c49b63]/30 transition-all duration-300 relative">
                
                {/* --- THAY THẾ PHẦN NÚT CŨ BẰNG COMPONENT MỚI --- */}
                <div className="absolute top-4 right-4 z-20">
                    <CategoryActions category={cat} />
                </div>

                {/* Icon Placeholder */}
                <div className="w-12 h-12 rounded-xl bg-[#c49b63]/10 text-[#c49b63] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <FiGrid size={24} />
                    )}
                </div>

                <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-[#c49b63] transition-colors">{cat.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{cat.description}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold">
                        {cat.count} sản phẩm
                    </span>
                    {/* Nút sửa nhanh (tùy chọn, có thể bỏ nếu đã có trong menu ...) */}
                    <div className="text-gray-400">
                        #{cat.displayOrder}
                    </div>
                </div>
            </div>
        ))}

        {/* Add New Quick Card */}
        <Link href="/admin/categories/create" className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#c49b63] hover:bg-[#c49b63]/5 transition-all gap-3 text-gray-400 hover:text-[#c49b63] h-full min-h-[200px]">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-white">
                <FiPlus size={24} />
            </div>
            <span className="font-medium">Tạo danh mục mới</span>
        </Link>
      </div>
    </div>
  );
}