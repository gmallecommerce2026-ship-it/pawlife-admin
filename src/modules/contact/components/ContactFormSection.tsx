'use client';

import React from 'react';
import { MapPin, Phone, Mail, Globe } from 'lucide-react';
import Button from '@/components/ui/Button'; // Import Button có sẵn của bạn

export const ContactFormSection = () => {
  return (
    <div className="w-full max-w-[1140px] px-4 flex flex-col lg:flex-row gap-24">
      {/* Left Column: Contact Information */}
      <div className="flex-1 space-y-12">
        <div className="space-y-2">
          <h2 className="font-sans text-3xl text-white font-normal mb-8">Thông tin liên hệ</h2>
          
          {/* Address */}
          <div className="flex gap-4 items-start">
             <div className="text-white mt-1"><MapPin size={20} /></div>
             <p className="font-sans text-[15px] font-light text-gray-400 leading-7">
               <span className="text-white font-normal mr-2">Địa chỉ:</span>
               198 Phố ABC, Quận XYZ, Thành phố Hà Nội, Việt Nam
             </p>
          </div>

          {/* Phone */}
          <div className="flex gap-4 items-center">
             <div className="text-white"><Phone size={20} /></div>
             <p className="font-sans text-[15px] font-light text-white leading-7">
               <span className="text-white font-normal mr-2">Số điện thoại:</span>
               <a href="tel:+911235235598" className="text-[#C49B63] hover:text-[#d4a86e]">(+84) 91.222.2222</a>
             </p>
          </div>

          {/* Email */}
          <div className="flex gap-4 items-center">
             <div className="text-white"><Mail size={20} /></div>
             <p className="font-sans text-[15px] font-light text-white leading-7">
               <span className="text-white font-normal mr-2">Email:</span>
               <a href="mailto:info@yoursite.com" className="text-[#C49B63] hover:text-[#d4a86e]">huy1232123@gmail.com</a>
             </p>
          </div>

          {/* Website */}
          <div className="flex gap-4 items-center">
             <div className="text-white"><Globe size={20} /></div>
             <p className="font-sans text-[15px] font-light text-white leading-7">
               <span className="text-white font-normal mr-2">Website:</span>
               <a href="https://yoursite.com" className="text-[#C49B63] hover:text-[#d4a86e]">h-coffee.com.vn</a>
             </p>
          </div>
        </div>
      </div>

      {/* Right Column: Contact Form */}
      <div className="flex-1">
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <input 
                type="text" 
                placeholder="Your Name" 
                className="w-full bg-transparent border-b border-white/20 py-3 text-white placeholder-white/70 focus:border-[#C49B63] focus:outline-none transition-colors font-sans font-light text-[15px]"
             />
             <input 
                type="email" 
                placeholder="Your Email" 
                className="w-full bg-transparent border-b border-white/20 py-3 text-white placeholder-white/70 focus:border-[#C49B63] focus:outline-none transition-colors font-sans font-light text-[15px]"
             />
          </div>
          
          <input 
             type="text" 
             placeholder="Subject" 
             className="w-full bg-transparent border-b border-white/20 py-3 text-white placeholder-white/70 focus:border-[#C49B63] focus:outline-none transition-colors font-sans font-light text-[15px]"
          />
          
          <textarea 
             placeholder="Message" 
             rows={4}
             className="w-full bg-transparent border-b border-white/20 py-3 text-white placeholder-white/70 focus:border-[#C49B63] focus:outline-none transition-colors font-sans font-light text-[15px] resize-none"
          />

          <div className="pt-4">
            <Button 
               variant="primary" 
               className="!bg-[#C49B63] hover:!bg-[#b38b55] !text-black !rounded-none !px-12 !py-4 !font-normal !text-[15px] !tracking-wider uppercase"
            >
              Gửi tin nhắn
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};