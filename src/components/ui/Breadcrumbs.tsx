// src/components/ui/Breadcrumbs.tsx
import React from "react";
import Link from "next/link";

export interface BreadcrumbItem {
  name: string;
  href?: string; // Cho phép href không bắt buộc (ví dụ: trang hiện tại)
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="flex items-center gap-2">
              {isLast || !item.href ? (
                // Nếu là trang cuối hoặc không có link -> Render Text thường
                <span className="font-sans text-base text-black font-medium" aria-current="page">
                  {item.name}
                </span>
              ) : (
                // Nếu có link -> Render Link
                <Link
                  href={item.href}
                  className="font-sans text-base text-gray-600 hover:text-brand-orange transition-colors"
                >
                  {item.name}
                </Link>
              )}

              {!isLast && (
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="text-gray-400"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;