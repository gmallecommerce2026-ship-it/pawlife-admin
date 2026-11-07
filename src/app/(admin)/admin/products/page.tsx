// src/app/(admin)/admin/products/page.tsx
import React from "react";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import Link from "next/link";
import { getProductsForAdmin, getCategoriesForFilter } from "@/actions/product";
import ProductToolbar from "./components/ProductToolbar";
import Image from "next/image";
import DeleteProductButton from "./components/DeleteProductButton";

// Định nghĩa Props cho Next.js 15 (searchParams là Promise)
interface ProductsPageProps {
  searchParams: Promise<{
    query?: string;
    page?: string;
    status?: "all" | "active" | "out_of_stock";
    categoryId?: string;
  }>;
}

export default async function ProductsPage(props: ProductsPageProps) {
  // 1. AWAIT searchParams (Bắt buộc ở Next.js 15)
  const searchParams = await props.searchParams;

  // 2. Parse Params
  const query = searchParams.query || "";
  const currentPage = Number(searchParams.page) || 1;
  const status = searchParams.status || "all";
  const categoryId = searchParams.categoryId ? Number(searchParams.categoryId) : undefined;
  const pageSize = 5;

  // 3. Fetch Data
  const [data, categories] = await Promise.all([
    getProductsForAdmin(currentPage, pageSize, query, status, categoryId),
    getCategoriesForFilter(),
  ]);

  const { products, total, totalPages } = data;

  // Helper để tạo URL cho phân trang an toàn (Tránh lỗi Symbol/Promise object)
  const createPageUrl = (newPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (status && status !== "all") params.set("status", status);
    if (categoryId) params.set("categoryId", categoryId.toString());
    params.set("page", newPage.toString());
    return `/admin/products?${params.toString()}`;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1d150b]">Danh sách món</h2>
          <p className="text-gray-500 text-sm mt-1">
            Quản lý thực đơn và kho hàng ({total} món)
          </p>
        </div>
        <Link
          href="/admin/products/create"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#c49b63] hover:bg-[#b08b55] text-white rounded-xl shadow-lg shadow-[#c49b63]/30 transition-all font-medium"
        >
          <FiPlus size={20} />
          <span>Thêm món mới</span>
        </Link>
      </div>

      {/* Toolbar */}
      <ProductToolbar categories={categories} />

      {/* Table List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold w-[80px]">Hình ảnh</th>
                <th className="px-6 py-4 font-semibold">Tên món</th>
                <th className="px-6 py-4 font-semibold">Danh mục</th>
                <th className="px-6 py-4 font-semibold">Giá bán</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length > 0 ? (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50/80 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 relative">
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                          // Thêm unoptimized nếu ảnh lỗi nhiều quá để test tạm
                          // unoptimized 
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#1d150b]">
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-400">#{product.id}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                        {product.categoryName}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#c49b63]">
                      {/* Đảm bảo basePrice là number trước khi gọi toLocaleString */}
                      {Number(product.basePrice).toLocaleString("vi-VN")}đ
                    </td>
                    <td className="px-6 py-4">
                      {product.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-xs font-medium border border-green-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          Đang bán
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-medium border border-red-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Hết hàng
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="p-2 text-gray-400 hover:text-[#c49b63] hover:bg-orange-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <FiEdit2 size={16} />
                        </Link>
                        
                        {/* Sử dụng Component Delete mới */}
                        <DeleteProductButton productId={product.id} productName={product.name} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Không tìm thấy sản phẩm nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Logic Fix */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>
            Hiển thị {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, total)} trên tổng số {total} sản phẩm
          </span>
          <div className="flex gap-2">
            <Link
              href={createPageUrl(currentPage - 1)}
              className={`px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 ${
                currentPage <= 1 ? "pointer-events-none opacity-50" : ""
              }`}
            >
              Trước
            </Link>
            <Link
              href={createPageUrl(currentPage + 1)}
              className={`px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 ${
                currentPage >= totalPages ? "pointer-events-none opacity-50" : ""
              }`}
            >
              Sau
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}