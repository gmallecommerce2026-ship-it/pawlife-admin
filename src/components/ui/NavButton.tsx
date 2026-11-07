import React from "react";

// Đã chuyển sang Tailwind class, sử dụng props để thay đổi
const NavButton = ({
  prop14, // bgColor
  prop29, // isTextGray
  prop32, // text
}: any) => {
  // Xác định xem có active hay không
  const isActive = prop14 === "rgba(231,135,32,1)"; // Logic cũ của bạn
  const isTextGray = prop29;

  return (
    <div
      className={`
        h-[52px] flex flex-row justify-center items-center gap-2.5 
        px-6 py-4 border rounded-2xl
        ${
          isActive
            ? "bg-brand-orange border-brand-orange"
            : "bg-white border-brand-gray-border"
        }
      `}
    >
      <div
        className={`
          font-sans text-lg whitespace-nowrap font-normal
          ${isActive ? "text-white" : "text-brand-gray"}
        `}
      >
        {prop32}
      </div>
    </div>
  );
};

export default NavButton;