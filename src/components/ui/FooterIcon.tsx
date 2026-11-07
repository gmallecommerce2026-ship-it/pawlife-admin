import React from "react";
import Image from "next/image"; // Ưu tiên dùng next/image

interface FooterIconProps {
  src: string;
  alt: string;
  href?: string;
}

const FooterIcon: React.FC<FooterIconProps> = ({ src, alt, href = "#" }) => {
  return (
    <a
      href={href}
      className="inline-block hover:scale-110 transition-transform duration-200"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="relative w-[30px] h-[30px]">
        {/* Dùng img thẻ thường nếu asset nằm trong public folder và không cấu hình domain next/image, 
            tuy nhiên ở đây tôi giữ img tag như cũ để tránh lỗi config, nhưng thêm class tailwind chuẩn */}
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-full object-contain" 
        />
      </div>
    </a>
  );
};

export default FooterIcon;