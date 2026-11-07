// src/app/(admin)/admin/products/components/ProductToolbar.tsx
"use client";

import React from "react";
import { FiSearch, FiFilter } from "react-icons/fi";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce"; // Giả sử bạn đã có hook này, nếu chưa có thể dùng setTimeout

interface Category {
  id: number;
  name: string;
}

export default function ProductToolbar({ categories }: { categories: Category[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Lấy giá trị hiện tại từ URL
  const currentSearch = searchParams.get("query") || "";
  const currentStatus = searchParams.get("status") || "all";
  const currentCategory = searchParams.get("categoryId") || "";

  // Hàm cập nhật URL
  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    params.set("page", "1"); // Reset về trang 1 khi search
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleFilterStatus = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status !== "all") {
        params.set("status", status);
    } else {
        params.delete("status");
    }
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
  };
    
  const handleFilterCategory = (categoryId: string) => {
    const params = new URLSearchParams(searchParams);
    if (categoryId) {
        params.set("categoryId", categoryId);
    } else {
        params.delete("categoryId");
    }
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between">
      <div className="relative flex-1 max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Tìm kiếm tên món..."
          defaultValue={currentSearch}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c49b63]/50 focus:border-[#c49b63]"
        />
      </div>
      <div className="flex gap-3">
        {/* Dropdown Category */}
        <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select 
                className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:border-[#c49b63] appearance-none"
                value={currentCategory}
                onChange={(e) => handleFilterCategory(e.target.value)}
            >
                <option value="">Tất cả danh mục</option>
                {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
            </select>
        </div>

        {/* Dropdown Status */}
        <select
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:border-[#c49b63]"
          value={currentStatus}
          onChange={(e) => handleFilterStatus(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang bán</option>
          <option value="out_of_stock">Hết hàng</option>
        </select>
      </div>
    </div>
  );
}