// src/app/(admin)/admin/categories/create/page.tsx
import React from "react";
import CreateCategoryForm from "./create-category-form";
import { getProductsForSelection } from "@/actions/categories";

export const metadata = {
  title: "Tạo danh mục mới | Admin Dashboard",
};

export default async function CreateCategoryPage() {
  // Fetch danh sách tất cả sản phẩm để user có thể chọn đưa vào danh mục
  const products = await getProductsForSelection();

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 pb-20">
      <CreateCategoryForm products={products} />
    </div>
  );
}