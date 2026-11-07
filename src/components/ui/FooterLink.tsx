import React from "react";
import Link from "next/link"; // Dùng Link của Next.js để tối ưu SPA

interface FooterLinkProps {
  label: string;
  href?: string;
  isHeader?: boolean;
  className?: string;
}

const FooterLink: React.FC<FooterLinkProps> = ({
  label,
  href = "#", // Default href nếu chưa có
  isHeader = false,
  className = "",
}) => {
  if (isHeader) {
    return (
      <h3 className={`font-bold text-gray-900 text-lg mb-4 ${className}`}>
        {label}
      </h3>
    );
  }

  return (
    <Link
      href={href}
      className={`block w-fit text-sm text-gray-600 hover:text-brand-orange hover:underline transition-colors duration-200 mb-2.5 ${className}`}
    >
      {label}
    </Link>
  );
};

export default FooterLink;