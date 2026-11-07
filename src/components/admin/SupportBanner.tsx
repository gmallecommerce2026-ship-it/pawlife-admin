// Thanh đỏ báo đang thao tác với tư cách shelter nào và còn bao lâu
import { stopSupport } from "@/actions/admin/support";
import type { SupportSession } from "@/lib/admin/support";

export default function SupportBanner({ session }: { session: SupportSession }) {
  const minutesLeft = Math.max(0, Math.ceil((session.expiresAt - Date.now()) / 60000));
  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 bg-red-600 px-6 py-2.5 text-sm text-white">
      <span>
        <strong>ĐANG HỖ TRỢ</strong> — shelter: <strong>{session.shelterName}</strong> · còn{" "}
        <strong>{minutesLeft} phút</strong> · chế độ {session.write ? "CHỈNH SỬA" : "CHỈ XEM"}
      </span>
      <form action={stopSupport}>
        <input type="hidden" name="shelterId" value={session.shelterId} />
        <button type="submit" className="rounded-md bg-white/15 px-3 py-1 font-semibold hover:bg-white/25">
          Thoát hỗ trợ
        </button>
      </form>
    </div>
  );
}
