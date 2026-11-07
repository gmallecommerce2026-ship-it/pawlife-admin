'use client';

import React from 'react';
import Image from 'next/image';

export const ContactHero = () => {
  return (
    <div className="absolute inset-0 w-full h-full">
      {/* Background Dark Overlay */}
      <div className="absolute inset-0 bg-black/50 z-10" />
      
      {/* Background Images - Sử dụng ảnh thật hoặc placeholder */}
      {/* ImageAsset6 equivalent */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/ImageAsset6.png" // Cần đảm bảo ảnh này tồn tại hoặc thay thế
          alt="Coffee Background"
          className="w-full h-full object-cover"
          // Fallback nếu không có ảnh
          onError={(e) => {
             e.currentTarget.src = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop"
          }}
        />
      </div>
      
      {/* Title - Contact Information */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pt-20">
         <h1 className="font-sans text-6xl font-bold text-white uppercase tracking-widest mb-4">
            Liên hệ chúng tôi
         </h1>
         <p className="text-white/70 font-light text-base max-w-2xl text-center">
            Liên hệ với chúng tôi để nhận được sự hỗ trợ tốt nhất
         </p>
      </div>

      {/* Carousel Dots (Mô phỏng Component2 trong code gốc) */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-2.5">
         {[true, false, true].map((isActive, idx) => (
             <div 
                key={idx}
                className={`w-[18px] h-[18px] border-2 border-white rounded-[9px] flex items-center justify-center`}
             >
                <div className={`w-3 h-3 rounded-md ${isActive ? 'bg-white/50' : 'bg-white'}`} />
             </div>
         ))}
      </div>
    </div>
  );
};