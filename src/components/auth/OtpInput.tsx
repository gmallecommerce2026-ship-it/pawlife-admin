"use client";
import React, { useRef, useState, useEffect } from "react";

interface OtpInputProps {
  length?: number;
  onComplete: (otp: string) => void;
}

export const OtpInput = ({ length = 6, onComplete }: OtpInputProps) => {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    // Lấy ký tự cuối cùng (trường hợp người dùng nhập đè)
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Trigger complete nếu đã nhập đủ
    const combinedOtp = newOtp.join("");
    if (combinedOtp.length === length) {
      onComplete(combinedOtp);
    }

    // Tự động chuyển focus sang ô tiếp theo
    if (value && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Xử lý nút Backspace
    if (e.key === "Backspace" && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").split("").filter(char => !isNaN(Number(char)));
    if (data.length === length) {
      setOtp(data);
      onComplete(data.join(""));
      inputRefs.current[length - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      {otp.map((data, index) => (
        <input
          key={index}
          ref={(el) => {
             // Gán ref nhưng không trả về gì (void) để khớp kiểu
             inputRefs.current[index] = el;
          }}
          type="text"
          maxLength={1}
          value={data}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="w-10 h-12 sm:w-12 sm:h-14 border border-gray-300 rounded-lg text-center text-xl font-semibold text-brand-orange focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all bg-white"
        />
      ))}
    </div>
  );
};