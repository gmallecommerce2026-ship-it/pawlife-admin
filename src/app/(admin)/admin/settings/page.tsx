// src/app/(admin)/admin/settings/page.tsx
import { db } from "@/lib/db";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  // Fetch dữ liệu từ server
  const settings = await db.storeSetting.findUnique({
    where: { id: 1 }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Cài đặt Cửa hàng</h2>
      
      {/* Truyền dữ liệu xuống Client Component */}
      <SettingsForm initialSettings={settings} />
    </div>
  );
}