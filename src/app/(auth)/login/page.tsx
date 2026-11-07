"use client";

import MockLoginButton from "@/components/admin/MockLoginButton";
import Link from "next/link";
import Image from "next/image";

type BgGif = {
  src: string; // link trực tiếp tới file GIF trong suốt trên media.tenor.com
  alt: string;
};

/**
 * Dùng thẻ <img> trỏ thẳng tới file GIF (thay cho iframe embed của Tenor)
 * nên nền sticker luôn trong suốt, không bị khung trắng.
 * 👉 Thêm GIF mới: dán thêm 1 object { src, alt } vào mảng này.
 */
const GIFS: BgGif[] = [
  {
    src: "https://media.tenor.com/O1fObmaZYEgAAAAj/ami-b%E1%BB%A5ng-b%E1%BB%B1.gif",
    alt: "Ami bụng bự giơ ngón cái",
  },
  {
    src: "https://media.tenor.com/fdfmAv0ZbjkAAAAj/ami-b%E1%BB%A5ng-b%E1%BB%B1.gif",
    alt: "Ami bụng bự mắt to",
  },
  {
    src: "https://media.tenor.com/SEIlEW0LzPQAAAAj/ami-b%E1%BB%A5ng-b%E1%BB%B1.gif",
    alt: "Ami bụng bự đứng với dấu hỏi chấm",
  },
  {
    src: "https://media.tenor.com/nBq0WuGRO14AAAAj/ami-b%E1%BB%A5ng-b%E1%BB%B1.gif",
    alt: "Ami bụng bự khóc",
  },
  {
    src: "https://media.tenor.com/RLpm94jfSwEAAAAj/m260422ami-cat.gif",
    alt: "Mèo làm mặt hề",
  },
  {
    src: "https://media.tenor.com/mMojkkZPWvMAAAAj/ami-b%E1%BB%A5ng-b%E1%BB%B1.gif",
    alt: "Ami bụng bự ngước nhìn trời",
  },
  {
    src: "https://media.tenor.com/vP6mnvFxWFcAAAAj/ami-b%E1%BB%A5ng-b%E1%BB%B1.gif",
    alt: "Ami bụng bự cười há miệng",
  },
  {
    src: "https://media.tenor.com/lwp-t8fxQhUAAAAj/xhr766rb2ug.gif",
    alt: "Mèo và chó đứng cạnh nhau",
  },
];

/**
 * Vị trí các "slot" rải quanh màn hình. GIF được gán lần lượt vào từng slot.
 * `hideOnMobile` để màn hình nhỏ không bị rối / che form.
 */
const SLOTS = [
  { pos: "left-[3%] top-[6%]", size: "w-28 md:w-48", rot: "-rotate-12", delay: "0s", hideOnMobile: false },
  { pos: "right-[4%] top-[10%]", size: "w-24 md:w-44", rot: "rotate-6", delay: "0.8s", hideOnMobile: false },
  { pos: "left-[6%] bottom-[8%]", size: "w-24 md:w-52", rot: "rotate-12", delay: "1.6s", hideOnMobile: false },
  { pos: "right-[5%] bottom-[6%]", size: "w-28 md:w-48", rot: "-rotate-6", delay: "2.4s", hideOnMobile: false },
  { pos: "left-[24%] top-[30%]", size: "w-24 md:w-36", rot: "rotate-3", delay: "3.2s", hideOnMobile: true },
  { pos: "right-[22%] bottom-[28%]", size: "w-24 md:w-36", rot: "-rotate-3", delay: "4s", hideOnMobile: true },
  { pos: "left-[40%] top-[1%]", size: "w-20 md:w-32", rot: "rotate-6", delay: "4.8s", hideOnMobile: true },
  { pos: "left-[42%] bottom-[1%]", size: "w-20 md:w-32", rot: "-rotate-6", delay: "5.6s", hideOnMobile: true },
];

export default function LoginBackground() {
  return (
    // Gốc: flex căn giữa popup. KHÔNG đặt pointer-events-none ở đây.
    <div className="fixed inset-0 z-0 flex items-center justify-center overflow-hidden p-4">
      {/* ===== Lớp nền (không bắt chuột) ===== */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-amber-50 to-emerald-100" />

        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(rgba(18,56,50,0.12) 1.5px, transparent 1.5px)",
            backgroundSize: "26px 26px",
          }}
        />

        {/* Các GIF bựa rải quanh màn hình */}
        {SLOTS.map((slot, i) => {
          const gif = GIFS[i % GIFS.length];
          return (
            <div
              key={`${gif.src}-${i}`}
              className={`absolute ${slot.pos} ${slot.size} ${slot.hideOnMobile ? "hidden md:block" : ""}`}
            >
              <div
                className={`${slot.rot} drop-shadow-xl`}
                style={{ animation: `pawFloat 6s ease-in-out ${slot.delay} infinite` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={gif.src}
                  alt={gif.alt}
                  draggable={false}
                  className="block h-auto w-full select-none"
                />
              </div>
            </div>
          );
        })}

        {/* Lớp mờ nhẹ ở giữa để popup dễ đọc */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0)_60%)]" />
      </div>

      {/* ===== Popup đăng nhập: ở giữa, nằm trên nền, bấm được ===== */}
      <div className="pointer-events-auto relative z-10 w-full max-w-md rounded-3xl border border-white/70 bg-white/85 p-8 shadow-2xl shadow-orange-900/10 backdrop-blur-xl md:p-10">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-[80px] items-center justify-center border-b border-gray-100 px-6">
            <Link href="/shelter/pets" className="block shrink-0 pt-1 transition-transform hover:scale-105">
              <Image
                src="/images/logo/pawlife-logo.png"
                alt="PawLife Logo"
                width={40}
                height={40}
                priority
                className="object-contain"
              />
            </Link>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[#123832]">PawLife Admin</h1>
          <p className="mt-2 text-sm text-gray-500">Đăng nhập vào bảng điều khiển</p>
        </div>

        <MockLoginButton />
      </div>

      <style>{`
        @keyframes pawFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-14px) scale(1.04); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="pawFloat"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}