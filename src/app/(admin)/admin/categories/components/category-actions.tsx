// src/app/(admin)/admin/categories/components/category-actions.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { FiMoreHorizontal, FiEdit2, FiTrash2, FiX, FiSave, FiAlertTriangle } from "react-icons/fi";
import { updateCategory, deleteCategory } from "@/actions/categories";
import { useRouter } from "next/navigation";

interface Category {
  id: number;
  name: string;
  imageUrl?: string | null;
  displayOrder: number;
  count: number; // Số lượng sản phẩm
}

export default function CategoryActions({ category }: { category: Category }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Xử lý Xóa
  const handleDelete = async () => {
    setIsLoading(true);
    const res = await deleteCategory(category.id);
    setIsLoading(false);
    if (res?.error) {
      alert(res.error);
    } else {
      setShowDeleteModal(false);
      setIsOpen(false);
    }
  };

  // Xử lý Sửa
  const handleUpdate = async (formData: FormData) => {
    setIsLoading(true);
    // Append ID vào formData
    formData.append("id", category.id.toString());
    
    const res = await updateCategory(formData);
    setIsLoading(false);
    
    if (res?.error) {
      alert(res.error);
    } else {
      setShowEditModal(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Nút Trigger ... */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-colors ${isOpen ? "text-[#c49b63] bg-orange-50" : "text-gray-300 hover:text-[#c49b63]"}`}
      >
        <FiMoreHorizontal size={20} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-1">
            <button
              onClick={() => { setShowEditModal(true); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#c49b63] rounded-lg transition-colors text-left"
            >
              <FiEdit2 size={16} />
              Chỉnh sửa
            </button>
            <button
              onClick={() => { setShowDeleteModal(true); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
            >
              <FiTrash2 size={16} />
              Xóa danh mục
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL EDIT --- */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-[#1d150b]">Sửa danh mục</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={24} />
              </button>
            </div>
            
            <form action={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục</label>
                <input
                  name="name"
                  defaultValue={category.name}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#c49b63]/20 focus:border-[#c49b63]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự hiển thị</label>
                <input
                  name="displayOrder"
                  type="number"
                  defaultValue={category.displayOrder}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#c49b63]/20 focus:border-[#c49b63]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh URL</label>
                <input
                  name="imageUrl"
                  defaultValue={category.imageUrl || ""}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#c49b63]/20 focus:border-[#c49b63]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-2 bg-[#1d150b] text-white rounded-lg font-medium hover:bg-[#3d2e1e] transition-colors disabled:opacity-70"
                >
                  {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DELETE CONFIRM --- */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 mx-auto">
              <FiAlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Xóa danh mục?</h3>
            <p className="text-center text-gray-500 mb-6">
              Bạn có chắc chắn muốn xóa "<strong>{category.name}</strong>"? 
              <br/>Hành động này không thể hoàn tác.
              {category.count > 0 && (
                <span className="block mt-2 text-red-500 text-sm font-medium">
                  Cảnh báo: Danh mục này đang có {category.count} sản phẩm. Bạn cần chuyển sản phẩm sang danh mục khác trước khi xóa.
                </span>
              )}
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 text-gray-700 font-medium bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading || category.count > 0} // Disable nếu còn sản phẩm
                className="flex-1 px-4 py-2.5 text-white font-medium bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Đang xóa..." : "Xóa ngay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}