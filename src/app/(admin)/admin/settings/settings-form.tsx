'use client';

import { useState, useTransition } from 'react';
import { updateStoreSettings } from "@/actions/settings";
import { Store, Save, Wifi, Phone, MapPin, Clock, Megaphone, Loader2 } from "lucide-react";
// Import Toast nếu bạn có (ví dụ: react-hot-toast hoặc sonner)
// import { toast } from 'sonner';

interface SettingsFormProps {
  initialSettings: any; // Hoặc type StoreSetting nếu đã generate prisma client
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = (formData: FormData) => {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await updateStoreSettings(formData);
        if (result.success) {
          setMessage({ type: 'success', text: 'Đã lưu cài đặt thành công!' });
          // toast.success('Đã lưu cài đặt');
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Có lỗi xảy ra, vui lòng thử lại.' });
      }
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      {/* Thông báo Feedback */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <form action={handleSubmit} className="space-y-6">
        
        {/* Section: Thông báo cho Staff */}
        <div className="border-b pb-6 bg-amber-50 p-4 rounded-lg border border-amber-100">
          <h3 className="text-lg font-semibold text-amber-800 mb-2 flex items-center gap-2">
            <Megaphone size={20} /> Thông báo Staff Dashboard
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Nội dung nhập ở đây sẽ hiện lên bảng điều khiển của nhân viên.
          </p>
          <textarea 
            name="staffNotification"
            defaultValue={initialSettings?.staffNotification || ""} 
            rows={3}
            className="w-full border-amber-200 border rounded-lg p-3 focus:ring-2 focus:ring-amber-500 bg-white" 
            placeholder="Ví dụ: Món Bánh Croissant đang hết hàng..."
          />
        </div>

        {/* Section 1: Thông tin chung */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Store size={20} /> Thông tin cơ bản
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tên quán</label>
              <input name="storeName" type="text" defaultValue={initialSettings?.storeName || ""} className="w-full border rounded-lg p-2.5" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1"><Phone size={14} className="inline"/> Hotline</label>
              <input name="hotline" type="text" defaultValue={initialSettings?.hotline || ""} className="w-full border rounded-lg p-2.5" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1"><MapPin size={14} className="inline"/> Địa chỉ</label>
              <input name="address" type="text" defaultValue={initialSettings?.address || ""} className="w-full border rounded-lg p-2.5" />
            </div>
          </div>
        </div>

        {/* Section 2: Vận hành */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Clock size={20} /> Thời gian & Tiện ích
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Giờ mở cửa</label>
              <input name="openTime" type="time" defaultValue={initialSettings?.openTime || "07:00"} className="w-full border rounded-lg p-2.5" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Giờ đóng cửa</label>
              <input name="closeTime" type="time" defaultValue={initialSettings?.closeTime || "22:00"} className="w-full border rounded-lg p-2.5" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1"><Wifi size={14} className="inline"/> Mật khẩu Wifi</label>
              <input name="wifiPass" type="text" defaultValue={initialSettings?.wifiPass || ""} className="w-full border rounded-lg p-2.5" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={isPending}
            className="flex items-center gap-2 bg-amber-700 text-white px-6 py-2.5 rounded-lg hover:bg-amber-800 transition shadow-sm font-medium disabled:opacity-50"
          >
            {isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}