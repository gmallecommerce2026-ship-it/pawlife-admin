"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce"; // Cần cài: npm i use-debounce hoặc tự viết hook

export default function UserToolbar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Hàm cập nhật URL
  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    params.set("page", "1"); // Reset về trang 1 khi search
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border">
      {/* 1. Search Box */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          placeholder="Tìm theo tên, email, sđt..."
          className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => handleSearch(e.target.value)}
          defaultValue={searchParams.get("q")?.toString()}
        />
      </div>

      {/* 2. Filter Role */}
      <select
        className="px-4 py-2 border rounded-lg bg-gray-50 text-sm focus:outline-none"
        onChange={(e) => handleFilter("role", e.target.value)}
        defaultValue={searchParams.get("role")?.toString()}
      >
        <option value="ALL">Tất cả Vai trò</option>
        <option value="CUSTOMER">Khách hàng</option>
        <option value="STAFF">Nhân viên</option>
        <option value="ADMIN">Admin</option>
      </select>

      {/* 3. Sort */}
      <select
        className="px-4 py-2 border rounded-lg bg-gray-50 text-sm focus:outline-none"
        onChange={(e) => handleFilter("sort", e.target.value)}
        defaultValue={searchParams.get("sort")?.toString()}
      >
        <option value="newest">Mới nhất</option>
        <option value="oldest">Cũ nhất</option>
        <option value="vip_desc">Điểm VIP (Cao - Thấp)</option>
        <option value="vip_asc">Điểm VIP (Thấp - Cao)</option>
      </select>
    </div>
  );
}