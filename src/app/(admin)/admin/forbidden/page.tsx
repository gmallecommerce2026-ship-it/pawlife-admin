import Link from "next/link";
import { Card } from "@/components/admin/ui";
export default function Forbidden() {
  return (
    <Card className="mx-auto mt-16 max-w-lg text-center">
      <h1 className="text-2xl font-bold text-red-600">403 — Không đủ quyền</h1>
      <p className="mt-2 text-sm text-gray-500">Tài khoản của bạn không có quyền truy cập mục này. Lần truy cập đã được ghi lại.</p>
      <Link href="/admin/dashboard" className="mt-4 inline-block text-sm font-semibold text-[#c49b63]">← Về tổng quan</Link>
    </Card>
  );
}
