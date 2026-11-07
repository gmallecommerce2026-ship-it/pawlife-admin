'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, Pencil, ArrowLeft } from 'lucide-react';

export interface SelectOption {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    allowCustom?: boolean;
    customPlaceholder?: string;
    searchable?: boolean;
    uppercase?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Chọn...',
    disabled,
    allowCustom = false,
    customPlaceholder = 'Nhập nội dung khác...',
    searchable = true,
    uppercase = true,
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [forceCustom, setForceCustom] = useState(false);
    const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
    const [mounted, setMounted] = useState(false);

    const triggerRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => setMounted(true), []);

    const matchedOption = options.find((o) => o.value === value);
    const isCustomValue = allowCustom && !!value && !matchedOption;
    const isTextMode = allowCustom && (forceCustom || isCustomValue);

    // Đóng khi click ra ngoài (cả trigger lẫn popup, vì popup render qua portal)
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (triggerRef.current?.contains(target)) return;
            if (popupRef.current?.contains(target)) return;
            setOpen(false);
            setSearch('');
        };

        const handleScroll = (e: Event) => {
            if (popupRef.current?.contains(e.target as Node)) return;
            const r = triggerRef.current?.getBoundingClientRect();
            if (r) {
                setRect({ top: r.bottom + 6, left: r.left, width: Math.max(r.width, 240) });
            } else {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClick);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, []);

    const openPopup = () => {
        if (disabled) return;
        const r = triggerRef.current?.getBoundingClientRect();
        if (r) {
            setRect({ top: r.bottom + 6, left: r.left, width: Math.max(r.width, 240) });
        }
        setOpen((v) => !v);
    };

    const filtered = search.trim()
        ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
        : options;

    const displayLabel = isCustomValue ? value : matchedOption?.label || '';

    return (
        <>
            <div ref={triggerRef} className="w-full">
                {isTextMode ? (
                    <div className="flex items-center gap-1.5">
                        <input
                            autoFocus={forceCustom}
                            type="text"
                            value={value}
                            disabled={disabled}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={customPlaceholder}
                            className={`flex-1 min-w-0 bg-transparent text-[14px] font-semibold text-black outline-none tracking-wide disabled:text-black ${uppercase ? 'uppercase' : ''
                                }`}
                        />
                        {!disabled && (
                            <button
                                type="button"
                                title="Chọn từ danh sách"
                                onClick={() => {
                                    setForceCustom(false);
                                    openPopup();
                                }}
                                className="text-gray-400 hover:text-[#E89B5A] transition-colors shrink-0"
                            >
                                <ArrowLeft size={14} />
                            </button>
                        )}
                    </div>
                ) : (
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={openPopup}
                        className="w-full flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed"
                    >
                        <span
                            className={`text-[14px] font-semibold truncate tracking-wide ${uppercase ? 'uppercase' : ''
                                } ${displayLabel ? 'text-black' : 'text-gray-400 normal-case font-normal'}`}
                        >
                            {displayLabel || placeholder}
                        </span>
                        {!disabled && (
                            <ChevronDown
                                size={14}
                                className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''
                                    }`}
                            />
                        )}
                    </button>
                )}
            </div>

            {mounted &&
                open &&
                rect &&
                !disabled &&
                createPortal(
                    <div
                        ref={popupRef}
                        style={{ position: 'fixed', top: rect.top, left: rect.left, width: rect.width }}
                        className="z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden origin-top animate-[popIn_0.12s_ease-out]"
                    >
                        {searchable && (
                            <div className="p-2 border-b border-gray-100">
                                <div className="flex items-center gap-2 bg-[#F9FAFB] border border-gray-200 rounded-xl px-3 py-2">
                                    <Search size={13} className="text-gray-400 shrink-0" />
                                    <input
                                        autoFocus
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Tìm kiếm..."
                                        className="w-full bg-transparent text-xs outline-none text-gray-700"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="max-h-[260px] overflow-y-auto py-1.5">
                            {filtered.length === 0 && (
                                <p className="text-center text-xs text-gray-400 py-4">Không tìm thấy kết quả</p>
                            )}
                            {filtered.map((opt) => {
                                const selected = opt.value === value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(opt.value);
                                            setForceCustom(false);
                                            setOpen(false);
                                            setSearch('');
                                        }}
                                        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left text-xs transition-colors ${selected
                                            ? 'bg-[#FFF8F0] text-[#E89B5A] font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="truncate">{opt.label}</span>
                                        {selected && <Check size={13} className="shrink-0 text-[#E89B5A]" />}
                                    </button>
                                );
                            })}
                        </div>

                        {allowCustom && (
                            <button
                                type="button"
                                onClick={() => {
                                    setForceCustom(true);
                                    setOpen(false);
                                    setSearch('');
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold text-[#5A90DA] border-t border-dashed border-gray-100 hover:bg-blue-50/50 transition-colors"
                            >
                                <Pencil size={13} />
                                Khác — Nhập tay
                            </button>
                        )}
                    </div>,
                    document.body
                )}
        </>
    );
};