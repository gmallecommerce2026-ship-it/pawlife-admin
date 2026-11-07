import React from 'react';
import Image from 'next/image';

// --- 1. Reusable Input Field ---
interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode; // Icon bên phải (ví dụ mắt ẩn hiện pass)
}

export const AuthInput = ({ label, icon, className, ...props }: AuthInputProps) => {
  return (
    <div className="w-full flex flex-col gap-2">
      <label className="font-medium text-base text-black">{label}</label>
      <div className="relative w-full">
        <input
          className={`w-full h-[40px] border border-gray-200 rounded px-3 text-black outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all ${className}`}
          {...props}
        />
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

// --- 2. Primary Button (Màu cam) ---
export const PrimaryButton = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="w-full h-[50px] bg-brand-orange text-white rounded-full font-medium text-base shadow-lg shadow-orange-200 hover:opacity-90 transition-opacity flex items-center justify-center"
  >
    {children}
  </button>
);

// --- 3. Social Login Button ---
interface SocialButtonProps {
  iconSrc: string;
  label: string;
}

export const SocialButton = ({ iconSrc, label }: SocialButtonProps) => (
  <button className="flex items-center justify-center gap-3 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors flex-1 min-w-[190px]">
    <Image src={iconSrc} alt="icon" width={24} height={24} className="w-6 h-6" />
    <span className="text-gray-700 font-normal text-sm font-[Poppins]">{label}</span>
  </button>
);

// --- 4. Layout Wrapper (Chia đôi màn hình) ---
export const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <div className="bg-white rounded-[20px] shadow-xl flex flex-col lg:flex-row overflow-hidden max-w-[1200px] w-full min-h-[600px]">
      {/* Cột Trái: Ảnh minh họa */}
      <div className="hidden lg:flex w-1/2 items-center justify-center p-10 bg-gray-50">
        <div className="relative w-full h-[300px]">
           {/* Thay src bằng ảnh thật của bạn */}
          <Image 
            src="/assets/ImageAsset1.png" 
            alt="Auth Illustration" 
            fill 
            className="object-contain" 
          />
        </div>
      </div>

      {/* Cột Phải: Form */}
      <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center items-center">
        {children}
      </div>
    </div>
  </div>
);