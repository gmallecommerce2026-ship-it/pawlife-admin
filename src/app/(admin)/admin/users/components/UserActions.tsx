// src/app/(admin)/admin/users/components/UserActions.tsx
"use client";

import { useState, useTransition } from "react";
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  X, 
  Loader2, 
  Save, 
  AlertTriangle 
} from "lucide-react";
import { updateUser, deleteUser } from "@/actions/user"; // Import action vừa tạo
import { Role } from "@prisma/client";

interface UserActionsProps {
  user: {
    id: string;
    name: string | null;
    userName: string | null;
    phone: string | null;
    role: Role;
    loyaltyPoints: number;
  };
}

export default function UserActions({ user }: UserActionsProps) {
  const [isOpen, setIsOpen] = useState(false); // Menu dropdown
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // State cho form edit
  const [formData, setFormData] = useState({
    fullName: user.name || "",
    phoneNumber: user.phone || "",
    role: user.role,
    points: user.loyaltyPoints
  });

  // --- Xử lý Update ---
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateUser({
        userId: user.id,
        ...formData
      });
      
      if (res.success) {
        setShowEditModal(false);
        setIsOpen(false);
        // Có thể thêm toast notification ở đây
        alert("Cập nhật thành công!");
      } else {
        alert(res.message);
      }
    });
  };

  // --- Xử lý Delete ---
  const handleDelete = async () => {
    startTransition(async () => {
      const res = await deleteUser(user.id);
      if (res.success) {
        setShowDeleteModal(false);
        setIsOpen(false);
        alert("Đã xóa người dùng!");
      } else {
        alert(res.message);
      }
    });
  };

  return (
    <div className="relative">
      {/* Nút mở Menu */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-indigo-600 transition-colors"
      >
        <MoreHorizontal size={18} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => { setShowEditModal(true); setIsOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
            >
              <Pencil size={14} /> Chỉnh sửa thông tin
            </button>
            <button
              onClick={() => { setShowDeleteModal(true); setIsOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t"
            >
              <Trash2 size={14} /> Xóa người dùng
            </button>
          </div>
        </>
      )}

      {/* --- MODAL EDIT --- */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Chỉnh sửa người dùng</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <input 
                  type="text" 
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <input 
                  type="text" 
                  value={formData.phoneNumber}
                  onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                  <select 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as Role})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="CUSTOMER">Khách hàng</option>
                    <option value="STAFF">Nhân viên</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Điểm tích lũy</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.points}
                    onChange={e => setFormData({...formData, points: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-70"
                >
                  {isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DELETE --- */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Xác nhận xóa?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Hành động này không thể hoàn tác. Dữ liệu của <strong>{user.name}</strong> sẽ bị xóa vĩnh viễn khỏi hệ thống.
            </p>
            
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-70"
              >
                {isPending && <Loader2 className="animate-spin" size={16} />}
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}