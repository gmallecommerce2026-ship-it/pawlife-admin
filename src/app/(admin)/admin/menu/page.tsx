// src/app/(admin)/admin/menu/page.tsx
import { Plus } from "lucide-react";

export default function MenuPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Menu Đồ uống</h2>
        <button className="flex items-center gap-2 bg-amber-700 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition">
          <Plus size={18} /> Thêm món mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Card Sản phẩm mẫu */}
        {[1, 2, 3, 4].map((item) => (
            <div key={item} className="bg-white rounded-xl shadow-sm border overflow-hidden group">
                <div className="h-40 bg-gray-200 w-full relative">
                    {/* Ảnh sản phẩm */}
                    <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold text-green-600">
                        Còn hàng
                    </div>
                </div>
                <div className="p-4">
                    <h3 className="font-bold text-gray-800">Cà phê Sữa đá</h3>
                    <p className="text-amber-700 font-bold mt-1">29.000đ</p>
                    <div className="flex gap-2 mt-4">
                        <button className="flex-1 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50">Sửa</button>
                        <button className="flex-1 py-1.5 border border-red-200 text-red-600 rounded text-sm hover:bg-red-50">Xóa</button>
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}