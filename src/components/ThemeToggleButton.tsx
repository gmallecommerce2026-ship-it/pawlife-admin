'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export const ThemeToggleButton = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Giữ nguyên kích thước khi chưa mount để tránh nhảy layout / lỗi hydration
  if (!mounted) return <div className="w-[68px] h-[36px] shrink-0" />;

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      role="switch"
      aria-checked={isDark}
      title={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      className="relative shrink-0 w-[68px] h-[36px] rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-between px-2.5 transition-colors"
    >
      <Sun size={15} className={isDark ? 'text-gray-400' : 'text-[#E89B5A]'} />
      <Moon size={15} className={isDark ? 'text-[#E89B5A]' : 'text-gray-400'} />
      <span
        className={`absolute top-[3px] left-[3px] w-[28px] h-[28px] rounded-full bg-[#E89B5A]/15 border border-[#E89B5A]/40 transition-transform duration-300 ${
          isDark ? 'translate-x-[32px]' : 'translate-x-0'
        }`}
      />
    </button>
  );
};