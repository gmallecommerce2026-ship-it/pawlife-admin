'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="hidden md:flex fixed bottom-6 right-6 z-[100] p-3 rounded-full bg-white border border-gray-200 shadow-lg text-gray-700 hover:scale-105 transition-transform"
      title="Đổi giao diện sáng/tối"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};