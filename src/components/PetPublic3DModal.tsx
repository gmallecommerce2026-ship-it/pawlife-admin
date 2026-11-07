// components/PetPublic3DModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { X, Sparkles, RotateCw, ZoomIn } from 'lucide-react';

// Import R3F Viewer theo cơ chế No-SSR để tương thích hoàn toàn với Next.js Client Side rendering
const Iphone173DViewer = dynamic(() => import('./Iphone173DViewer'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex flex-col items-center justify-center text-white gap-3">
            <div className="w-10 h-10 border-4 border-[#E89B5A] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-white/80">Đang tải mô hình 3D iPhone 17 Pro Max...</p>
        </div>
    ),
});

interface PetPublic3DModalProps {
    pet: any;
    onClose: () => void;
}

export function PetPublic3DModal({ pet, onClose }: PetPublic3DModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!mounted) return null;

    // QUAN TRỌNG: render bằng createPortal thẳng vào document.body.
    // Nếu không, modal sẽ bị render lồng bên trong cây layout (ví dụ <main> cạnh <aside> sidebar),
    // và nếu bất kỳ ancestor nào giữa nó với <body> có position/transform/isolation tạo
    // stacking context riêng, thì z-index dù để 99999 vẫn chỉ có hiệu lực NỘI BỘ trong
    // ancestor đó — không thể đè lên sidebar (nằm ở stacking context khác, ngang hàng
    // với ancestor này chứ không phải bên trong nó). Portal loại bỏ hoàn toàn vấn đề này.
    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            {/* Background Video động lặp lại đẹp mắt */}
            <div className="absolute inset-0 overflow-hidden opacity-35 pointer-events-none">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-105 filter blur-[2px]"
                >
                    <source
                        src="https://assets.mixkit.co/videos/preview/mixkit-abstract-glowing-particles-in-motion-41551-large.mp4"
                        type="video/mp4"
                    />
                </video>
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
            </div>

            {/* Header Modal */}
            <div className="absolute top-6 left-6 right-6 z-50 flex items-center justify-between">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-full text-white">
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Vùng Canvas 3D */}
            <div className="relative w-full h-full max-w-6xl max-h-[90vh] z-20 flex items-center justify-center p-4">
                <Iphone173DViewer pet={pet} />
            </div>
        </div>,
        document.body
    );
}