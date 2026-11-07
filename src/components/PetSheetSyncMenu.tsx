'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FiDownload, FiEdit3, FiFileText, FiUpload } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import axiosClient from '@/lib/api/axiosClient';
import { usePetActions } from '@/stores/usePetStore';

const BASE = '/shelter-dashboard/pet-sheet';
const saveBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
};

export const PetSheetSyncMenu: React.FC = () => {
    const { fetchPets } = usePetActions();
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onDown = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, []);

    const run = async (name: string, fn: () => Promise<void>) => {
        setBusy(name);
        try { await fn(); } catch (e: any) {
            const m = e?.response?.data?.message;
            toast.error(Array.isArray(m) ? m.join(', ') : m ?? e?.message ?? 'Có lỗi xảy ra');
        } finally { setBusy(null); }
    };
    const download = (path: string, file: string) => run(path, async () => {
        const { data } = await axiosClient.get(`${BASE}/${path}`, { responseType: 'blob' });
        saveBlob(data, file);
    });
    const upload = (f: File) => run('upload', async () => {
        const fd = new FormData();
        fd.append('file', f);
        const { data } = await axiosClient.post(`${BASE}/upload`, fd);
        await fetchPets();
        toast.success(`Đã nhập: ${data.created} mới, ${data.updated} cập nhật, ${data.unchanged} không đổi.`);
    });
    const syncImages = () => run('images', async () => {
        const { data } = await axiosClient.post(`${BASE}/images`);
        await fetchPets();
        toast.success(`Gắn ${data.added} ảnh cho ${data.pets} pet. Chưa đọc được: ${data.failed}, không có link: ${data.noLink}.`);
    });
    const cls = 'w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-[#FFF4EA] rounded-lg disabled:opacity-50 text-left';
    return (
        <div ref={wrapRef} className="relative shrink-0">
            <button type="button" onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-1.5 bg-[#FFF4EA] hover:bg-[#FFEBD6] text-[#FFBA7F] text-sm font-semibold px-4 py-2 rounded-full whitespace-nowrap">
                <FiFileText size={14} /> Bảng & Excel
            </button>
            {open && (
                <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-lg p-2 z-30">
                    <Link href="/shelter/pets/sheet" className={cls}><FiEdit3 size={14} /> Mở bảng chỉnh sửa</Link>
                    <button className={cls} disabled={!!busy} onClick={() => fileRef.current?.click()}>
                        <FiUpload size={14} /> {busy === 'upload' ? 'Đang nhập...' : 'Nhập từ file Excel'}
                    </button>
                    <button className={cls} disabled={!!busy} onClick={() => download('export', 'pawlife-pets.xlsx')}><FiDownload size={14} /> Xuất Excel (.xlsx)</button>
                    <button className={cls} disabled={!!busy} onClick={syncImages}><FiDownload size={14} /> {busy === 'images' ? 'Đang gắn ảnh...' : 'Lấy ảnh từ Drive'}</button>
                    <button className={cls} disabled={!!busy} onClick={() => download('template', 'pawlife-pet-template.xlsx')}><FiDownload size={14} /> Tải file mẫu</button>
                </div>
            )}
            <input ref={fileRef} type="file" accept=".xlsx" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload(f); }} />
        </div>
    );
};
export default PetSheetSyncMenu;