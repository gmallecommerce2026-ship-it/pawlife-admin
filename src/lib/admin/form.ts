// src/lib/admin/form.ts
export const str = (fd: FormData, k: string): string => String(fd.get(k) ?? "").trim();
export const num = (fd: FormData, k: string): number | null => {
  const v = str(fd, k);
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
export const checked = (fd: FormData, k: string): boolean => fd.get(k) === "on" || fd.get(k) === "true";

/** Mọi thao tác quản trị đều phải có ghi chú nội bộ */
export function requireNote(fd: FormData): string {
  const note = str(fd, "note");
  if (!note) throw new Error("Bắt buộc nhập ghi chú nội bộ");
  return note;
}
