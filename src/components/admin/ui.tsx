// src/components/admin/ui.tsx  (server-safe, không có state)
import Link from "next/link";
import React from "react";

export const inputCls =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#c49b63] focus:ring-2 focus:ring-[#c49b63]/20";
export const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500";
export const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50";
export const btnVariant = {
  primary: `${btnBase} bg-[#1d150b] text-[#c49b63] hover:bg-black`,
  danger: `${btnBase} bg-red-600 text-white hover:bg-red-700`,
  ghost: `${btnBase} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50`,
  success: `${btnBase} bg-emerald-600 text-white hover:bg-emerald-700`,
} as const;

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[#1d150b]">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

export function StatCard({ label, value, hint, href }: { label: string; value: number | string; hint?: string; href?: string }) {
  const inner = (
    <Card className="transition hover:shadow-md">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#1d150b]">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

const TONES = {
  gray: "bg-gray-100 text-gray-700",
  green: "bg-emerald-50 text-emerald-700",
  yellow: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-blue-50 text-blue-700",
  purple: "bg-purple-50 text-purple-700",
} as const;

export function Badge({ tone = "gray", children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function TabLinks({
  items,
}: {
  items: { href: string; label: string; active: boolean; count?: number }[];
}) {
  return (
    <div className="mb-5 flex flex-wrap gap-2 border-b border-gray-200">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`-mb-px border-b-2 px-3 pb-2 text-sm font-medium ${
            t.active ? "border-[#c49b63] text-[#1d150b]" : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 text-xs text-gray-400">({t.count})</span>}
        </Link>
      ))}
    </div>
  );
}

export function Pager({
  page,
  pageSize,
  total,
  basePath,
  query,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  query: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p: number) => {
    const sp = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => v && sp.set(k, v));
    sp.set("page", String(p));
    return `${basePath}?${sp.toString()}`;
  };
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
      <span>
        Tổng {total} · trang {page}/{pages}
      </span>
      <div className="flex gap-2">
        {page > 1 && <Link className={btnVariant.ghost} href={href(page - 1)}>← Trước</Link>}
        {page < pages && <Link className={btnVariant.ghost} href={href(page + 1)}>Sau →</Link>}
      </div>
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400">{text}</div>;
}

export function Notice({ children, tone = "gray" }: { children: React.ReactNode; tone?: keyof typeof TONES }) {
  return <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${TONES[tone]}`}>{children}</div>;
}

export function DataTable({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">{children}</tbody>
      </table>
    </div>
  );
}
