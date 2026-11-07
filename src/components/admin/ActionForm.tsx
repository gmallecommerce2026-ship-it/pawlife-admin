"use client";
// Form thao tác quản trị: có bước xác nhận (nếu có confirmMessage) và ghi chú nội bộ bắt buộc
import React from "react";
import { btnVariant, inputCls } from "./ui";

type Props = {
  action: (fd: FormData) => void | Promise<void>;
  hidden?: Record<string, string>;
  label: string;
  variant?: keyof typeof btnVariant;
  confirmMessage?: string;
  note?: boolean;
  notePlaceholder?: string;
  className?: string;
  children?: React.ReactNode;
};

export default function ActionForm({
  action,
  hidden = {},
  label,
  variant = "primary",
  confirmMessage,
  note = true,
  notePlaceholder,
  className = "",
  children,
}: Props) {
  return (
    <form
      action={action}
      className={`space-y-2 ${className}`}
      onSubmit={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {children}
      {note && (
        <textarea
          name="note"
          required
          rows={2}
          placeholder={notePlaceholder ?? "Ghi chú nội bộ (bắt buộc)"}
          className={inputCls}
        />
      )}
      <button type="submit" className={btnVariant[variant]}>
        {label}
      </button>
    </form>
  );
}
