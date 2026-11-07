import React from "react";
import Link from "next/link";
import { PhoneIcon, QuestionMarkCircleIcon, ShieldCheckIcon } from "@heroicons/react/24/solid"; // Sử dụng Heroicons cho nhẹ

const TopBar = () => {
  return (
    <div className="w-full bg-[#F2F2F2] h-11 hidden md:flex items-center justify-center border-b border-gray-200 z-50 relative">
      <div className="w-full max-w-[1340px] px-4 flex justify-between items-center h-full text-[15px] font-roboto font-normal text-gray-500">
        
        {/* Left Side: Hotline */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 pr-3 border-r border-white">
            <span className="text-gray-500">Hotline:</span>
            <a href="tel:19001221" className="text-[#960D76] font-medium hover:underline">
              19001221
            </a>
          </div>
          <div className="flex items-center gap-2">
            <span>Tổng điểm đóng góp:</span>
            <span className="text-brand-orange font-medium">114.051.160 đ</span>
          </div>
        </div>

        {/* Right Side: Links */}
        <div className="flex items-center gap-6">
          <Link href="/seller/login" className="flex items-center gap-1 hover:text-brand-orange transition-colors">
            <QuestionMarkCircleIcon className="w-4 h-4" />
            <span>Kênh người bán</span>
          </Link>
          <div className="h-4 w-px bg-gray-300"></div>
          <Link href="/help" className="flex items-center gap-1 hover:text-brand-orange transition-colors">
            <QuestionMarkCircleIcon className="w-4 h-4" />
            <span>Trợ giúp</span>
          </Link>
          <div className="h-4 w-px bg-gray-300"></div>
          <Link href="/policy" className="flex items-center gap-1 hover:text-brand-orange transition-colors">
            <ShieldCheckIcon className="w-4 h-4" />
            <span>Chính sách</span>
          </Link>
          <div className="h-4 w-px bg-gray-300"></div>
          <Link href="/contact" className="flex items-center gap-1 hover:text-brand-orange transition-colors">
            <PhoneIcon className="w-4 h-4" />
            <span>Liên hệ</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TopBar;