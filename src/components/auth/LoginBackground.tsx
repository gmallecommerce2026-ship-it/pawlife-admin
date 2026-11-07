"use client";
// Nền toàn màn hình cho trang đăng nhập.
// Ưu tiên ảnh/GIF tại `src` (mặc định /images/login/ami-bg.gif). Nếu không tải được, hiện cảnh SVG tự vẽ có chuyển động.
import { useState } from "react";

export default function LoginBackground({ src = "/images/login/ami-bg.gif" }: { src?: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden bg-[#FFE9CF]">
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <FallbackScene />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/0 to-white/35" />
    </div>
  );
}

export function FallbackScene() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#FFD9A8] via-[#FFE9CF] to-[#FFF6EC]">
      <style>{`
        @keyframes ls-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
        @keyframes ls-breathe { 0%,100% { transform: scale(1) } 50% { transform: scale(1.035) } }
        @keyframes ls-blink { 0%,92%,100% { transform: scaleY(1) } 95% { transform: scaleY(0.1) } }
        @keyframes ls-wave { 0%,100% { transform: rotate(-8deg) } 50% { transform: rotate(14deg) } }
        @keyframes ls-drift { from { transform: translateX(-120px) } to { transform: translateX(calc(100vw + 120px)) } }
        @keyframes ls-rise { 0% { transform: translateY(0); opacity: 0 } 15% { opacity: .55 } 100% { transform: translateY(-110vh); opacity: 0 } }
        .ls-body { transform-box: fill-box; transform-origin: center bottom; animation: ls-breathe 3.2s ease-in-out infinite; }
        .ls-character { animation: ls-float 4s ease-in-out infinite; }
        .ls-eye { transform-box: fill-box; transform-origin: center; animation: ls-blink 4.5s infinite; }
        .ls-arm { transform-box: fill-box; transform-origin: top center; animation: ls-wave 2.4s ease-in-out infinite; }
        .ls-cloud { animation: ls-drift linear infinite; }
        .ls-paw { animation: ls-rise linear infinite; }
      `}</style>

      {/* Mây trôi */}
      <svg className="absolute left-0 top-[12%] w-40 opacity-80 ls-cloud" style={{ animationDuration: "48s" }} viewBox="0 0 160 70">
        <ellipse cx="60" cy="45" rx="50" ry="22" fill="#fff" /><ellipse cx="100" cy="35" rx="36" ry="26" fill="#fff" />
      </svg>
      <svg className="absolute left-0 top-[28%] w-28 opacity-60 ls-cloud" style={{ animationDuration: "64s", animationDelay: "-20s" }} viewBox="0 0 160 70">
        <ellipse cx="60" cy="45" rx="50" ry="22" fill="#fff" /><ellipse cx="100" cy="35" rx="36" ry="26" fill="#fff" />
      </svg>

      {/* Dấu chân bay lên */}
      {[8, 22, 38, 56, 72, 88].map((left, i) => (
        <svg key={i} className="absolute bottom-0 w-6 ls-paw text-[#E89B5A]" style={{ left: `${left}%`, animationDuration: `${9 + i * 1.3}s`, animationDelay: `${-i * 1.7}s` }} viewBox="0 0 24 24">
          <circle cx="12" cy="16" r="5" fill="#E89B5A" /><circle cx="5" cy="9" r="2.6" fill="#E89B5A" /><circle cx="9.5" cy="5" r="2.6" fill="#E89B5A" /><circle cx="14.5" cy="5" r="2.6" fill="#E89B5A" /><circle cx="19" cy="9" r="2.6" fill="#E89B5A" />
        </svg>
      ))}

      {/* Nhân vật bụng bự (vẽ riêng, không dùng hình của bên thứ ba) */}
      <div className="absolute bottom-[4%] left-1/2 w-[min(78vw,460px)] -translate-x-1/2 ls-character">
        <svg viewBox="0 0 400 400" className="h-auto w-full drop-shadow-[0_18px_30px_rgba(120,60,20,0.25)]">
          {/* Tay */}
          <ellipse className="ls-arm" cx="92" cy="262" rx="26" ry="44" fill="#F5A962" />
          <ellipse className="ls-arm" style={{ animationDelay: "-1.2s" }} cx="308" cy="262" rx="26" ry="44" fill="#F5A962" />
          {/* Thân + bụng to */}
          <g className="ls-body">
            <ellipse cx="200" cy="278" rx="150" ry="112" fill="#F5A962" />
            <ellipse cx="200" cy="300" rx="104" ry="82" fill="#FFE6C7" />
          </g>
          {/* Chân */}
          <ellipse cx="150" cy="378" rx="42" ry="20" fill="#F5A962" />
          <ellipse cx="250" cy="378" rx="42" ry="20" fill="#F5A962" />
          {/* Đầu + tai */}
          <polygon points="122,110 140,38 186,88" fill="#F5A962" />
          <polygon points="278,110 260,38 214,88" fill="#F5A962" />
          <polygon points="136,96 146,58 172,88" fill="#FFC9A0" />
          <polygon points="264,96 254,58 228,88" fill="#FFC9A0" />
          <ellipse cx="200" cy="160" rx="100" ry="88" fill="#F5A962" />
          {/* Mặt */}
          <ellipse className="ls-eye" cx="164" cy="158" rx="9" ry="11" fill="#2B1D12" />
          <ellipse className="ls-eye" cx="236" cy="158" rx="9" ry="11" fill="#2B1D12" />
          <circle cx="167" cy="154" r="3" fill="#fff" />
          <circle cx="239" cy="154" r="3" fill="#fff" />
          <ellipse cx="140" cy="186" rx="14" ry="9" fill="#FF8FA3" opacity="0.6" />
          <ellipse cx="260" cy="186" rx="14" ry="9" fill="#FF8FA3" opacity="0.6" />
          <path d="M193 178 L207 178 L200 186 Z" fill="#E0607A" />
          <path d="M200 186 Q190 198 180 190 M200 186 Q210 198 220 190" stroke="#8A4B1F" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
