import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();

  // 1. Check Server-side: Nếu không phải Admin, đuổi về trang chủ
  if (session?.user.role !== "ADMIN") {
    return (
        <div className="flex flex-col items-center justify-center h-screen gap-4">
            <h1 className="text-3xl font-bold text-red-600">403 Forbidden</h1>
            <p>Bạn là: {session?.user.role}. Bạn không có quyền truy cập trang này.</p>
        </div>
    )
  }

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold text-green-600">Trang quản trị Admin</h1>
      <div className="mt-4 p-4 border rounded bg-gray-50">
        <p>Current Role: <strong>{session?.user.role}</strong></p>
        <p>User ID: {session?.user.id}</p>
        <p>Email: {session?.user.email}</p>
      </div>
    </div>
  );
}