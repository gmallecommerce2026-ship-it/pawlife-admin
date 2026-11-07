// src/app/(admin)/admin/products/components/DeleteProductButton.tsx
"use client";

import React, { useState } from "react";
import { FiTrash2, FiAlertTriangle, FiX } from "react-icons/fi";
import { deleteProduct } from "@/actions/product";

interface DeleteProductButtonProps {
  productId: number;
  productName: string;
}

export default function DeleteProductButton({ productId, productName }: DeleteProductButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteProduct(productId);
    setIsDeleting(false);
    
    if (result.success) {
      setIsOpen(false);
      // Có thể thêm toast thông báo thành công ở đây
    } else {
      alert(result.error);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        title="Xóa sản phẩm"
      >
        <FiTrash2 size={16} />
      </button>

      {/* Modal Popup */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <FiAlertTriangle className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Xác nhận xóa</h3>
              <p className="text-sm text-gray-500 mt-1">
                Bạn có chắc chắn muốn xóa món <span className="font-bold text-gray-800">"{productName}"</span>?
              </p>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-sm text-gray-600 text-center">
                Hành động này không thể hoàn tác. Dữ liệu đơn hàng liên quan có thể bị ảnh hưởng.
              </p>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 flex gap-3 justify-center">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 shadow-lg shadow-red-600/30 transition-all flex items-center gap-2"
              >
                {isDeleting ? "Đang xóa..." : "Xóa ngay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}