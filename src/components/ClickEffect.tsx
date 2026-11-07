'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

type Burst = { id: number; x: number; y: number };

export const ClickEffect = () => {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const onDown = (e: PointerEvent) => {
      const id = Date.now() + Math.random();
      setBursts((p) => [...p, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setBursts((p) => p.filter((b) => b.id !== id)), 700);
    };
    window.addEventListener('pointerdown', onDown, { passive: true });
    return () => window.removeEventListener('pointerdown', onDown);
  }, [reduce]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[2147483647]">
      <AnimatePresence>
        {bursts.map((b) => (
          <div key={b.id} style={{ position: 'absolute', left: b.x, top: b.y }}>
            <motion.span
              initial={{ opacity: 0.6, scale: 0.2 }}
              animate={{ opacity: 0, scale: 1.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="absolute -left-4 -top-4 h-8 w-8 rounded-full border-2 border-[#E89B5A]"
            />
            <motion.span
              initial={{ opacity: 1, y: 0, scale: 0.6 }}
              animate={{ opacity: 0, y: -28, scale: 1.1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute -left-2 -top-3 text-[14px]"
            >
              🐾
            </motion.span>
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};