// src/app/(admin)/admin/categories/create/create-category-form.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FiSave, FiArrowLeft, FiSearch, FiCheck } from "react-icons/fi";
import { createCategory } from "@/actions/categories";

// Định nghĩa kiểu dữ liệu cho props
interface ProductOption {
  id: number;
  name: string;
  category: { name: string } | null;
}

interface CreateCategoryFormProps {
  products: ProductOption[];
}

export default function CreateCategoryForm({ products }: CreateCategoryFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  // Lọc sản phẩm theo từ khóa tìm kiếm
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Xử lý chọn/bỏ chọn sản phẩm
  const toggleProduct = (id: number) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    // Append các ID sản phẩm đã chọn vào FormData thủ công vì checkbox UI tùy chỉnh
    selectedProducts.forEach((id) => {
      formData.append("productIds", id.toString());
    });

    await createCategory(formData);
    setIsLoading(false);
  };

  return (
    <form action={handleSubmit} className="max-w-5xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/categories"
            className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-500 hover:text-[#c49b63] transition-colors"
          >
            <FiArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-[#1d150b]">Tạo danh mục mới</h1>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/categories"
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Hủy bỏ
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#1d150b] text-white rounded-xl font-medium shadow-lg shadow-[#1d150b]/20 hover:bg-[#3d2e1e] transition-all disabled:opacity-70"
          >
            <FiSave size={18} />
            {isLoading ? "Đang lưu..." : "Lưu danh mục"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột trái: Thông tin chính */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Thông tin chung</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  required
                  placeholder="Ví dụ: Cà phê máy, Trà sữa..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#c49b63]/20 focus:border-[#c49b63] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thứ tự hiển thị
                </label>
                <input
                  name="displayOrder"
                  type="number"
                  defaultValue={0}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#c49b63]/20 focus:border-[#c49b63] transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Số nhỏ sẽ hiển thị trước.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link hình ảnh (URL)
                </label>
                <input
                  name="imageUrl"
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#c49b63]/20 focus:border-[#c49b63] transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Chọn sản phẩm */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Thêm sản phẩm</h3>
            <p className="text-sm text-gray-500 mb-4">
              Chọn các sản phẩm thuộc danh mục này (Sẽ di chuyển sản phẩm từ danh mục cũ sang đây).
            </p>

            {/* Search Box */}
            <div className="relative mb-4">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#c49b63]"
              />
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto max-h-[400px] pr-2 space-y-2 custom-scrollbar">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const isSelected = selectedProducts.includes(product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#c49b63] bg-[#c49b63]/5"
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isSelected ? "text-[#c49b63]" : "text-gray-700"}`}>
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          Hiện tại: {product.category?.name || "Chưa phân loại"}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-[#c49b63] border-[#c49b63] text-white"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {isSelected && <FiCheck size={12} />}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Không tìm thấy sản phẩm nào.
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500 text-center">
              Đã chọn: <span className="font-bold text-[#c49b63]">{selectedProducts.length}</span> sản phẩm
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}