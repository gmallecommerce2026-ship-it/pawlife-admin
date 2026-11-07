'use client';

import { useEffect, useRef, useState, type DependencyList } from 'react';

/**
 * Đo chiều cao thực tế (scrollHeight) của phần tử content bên trong,
 * để cha có thể set height={height} + CSS "transition-[height]" và
 * animate mượt khi số lượng/kích thước item thay đổi.
 *
 * Lý do cần hook riêng: CSS không tự transition được từ/về "height: auto",
 * nên phải đo chiều cao bằng JS (ResizeObserver) rồi set height cụ thể (px).
 *
 * Cách dùng:
 *   const { contentRef, height } = useAutoHeight([applications.length]);
 *   <div style={{ height }} className="transition-[height] duration-300 ease-in-out overflow-hidden">
 *     <div ref={contentRef}>...nội dung thật...</div>
 *   </div>
 */
export function useAutoHeight<T extends HTMLElement = HTMLDivElement>(
  deps: DependencyList = []
) {
  const contentRef = useRef<T>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const update = () => setHeight(el.scrollHeight);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { contentRef, height };
}