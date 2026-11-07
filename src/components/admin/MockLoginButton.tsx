import { mockLogin } from "@/actions/mock-auth";
import { MOCK } from "@/lib/mock/config";

// Chỉ hiển thị khi bật chế độ FE mock
export default function MockLoginButton() {
  if (!MOCK) return null;
  return (
    <form action={mockLogin} className="mb-6 space-y-2">
      <button type="submit" className="w-full rounded-xl bg-[#1d150b] py-3 font-semibold text-[#c49b63] hover:bg-black">
        Đăng nhập demo (Quản trị viên)
      </button>
      <p className="text-center text-xs text-gray-400">Chế độ FE mock: không cần backend hay database</p>
    </form>
  );
}
