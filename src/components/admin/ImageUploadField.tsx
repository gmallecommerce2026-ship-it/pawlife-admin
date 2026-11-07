"use client";
// Tải ảnh lên Cloudflare R2 qua presigned URL (uploadFileToR2), lưu URL vào input hidden
import { useState } from "react";
import { uploadFileToR2 } from "@/lib/upload/uploadToR2";
import { MOCK } from "@/lib/mock/config";
import { inputCls, labelCls } from "./ui";

export default function ImageUploadField({
  name,
  label,
  folder,
  defaultValue,
}: {
  name: string;
  label: string;
  folder: string;
  defaultValue?: string | null;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onPick(file?: File) {
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      // FE mock: xem trước ảnh cục bộ, không upload
      setUrl(MOCK ? URL.createObjectURL(file) : await uploadFileToR2(file, { folder }));
    } catch (e) {
      setErr("Tải ảnh thất bại. Kiểm tra kết nối backend.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className={labelCls}>{label}</span>
      <div className="flex items-center gap-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-16 w-24 rounded-lg object-cover" />
        ) : (
          <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">Chưa có</div>
        )}
        <input type="file" accept="image/*" disabled={busy} onChange={(e) => onPick(e.target.files?.[0])} className="text-sm" />
      </div>
      {busy && <p className="mt-1 text-xs text-gray-500">Đang tải lên…</p>}
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
      <input type="hidden" name={name} value={url} />
      <input className={`${inputCls} mt-2`} placeholder="Hoặc dán URL ảnh" value={url} onChange={(e) => setUrl(e.target.value)} />
    </div>
  );
}
