// src/app/not-found.tsx
import React from "react";
import Link from "next/link";
import { FiAlertCircle } from "react-icons/fi";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-brand-orange mb-4">
        <FiAlertCircle size={64} />
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Không tìm thấy trang</h2>
      <p className="text-gray-500 mb-6 max-w-md">
        Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
      </p>
      <Link 
        href="/"
        className="bg-brand-orange text-white px-6 py-3 rounded-full font-medium hover:bg-opacity-90 transition-all"
      >
        Về trang chủ
      </Link>
    </div>
  );
}