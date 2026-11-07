'use client';

import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, Code2, ArrowLeft, Send } from 'lucide-react';
import axiosClient from '@/lib/api/axiosClient';
import { createPortal } from 'react-dom';
type Target = 'ADMIN' | 'DEVELOPER';
type Step = 'choose' | 'form' | 'success';

interface WriteMessageModalProps {
    onClose: () => void;
}

export const WriteMessageModal: React.FC<WriteMessageModalProps> = ({ onClose }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const [step, setStep] = useState<Step>('choose');

    const [target, setTarget] = useState<Target | null>(null);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChooseTarget = (t: Target) => {
        setTarget(t);
        setStep('form');
    };

    const handleBack = () => {
        setStep('choose');
        setTarget(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!target) return;
        if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
            setError('Vui lòng điền đầy đủ thông tin.');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            await axiosClient.post('/support/contact', {
                name: name.trim(),
                email: email.trim(),
                subject: subject.trim(),
                message: message.trim(),
                target,
            });
            setStep('success');
        } catch (err: any) {
            console.error('[WriteMessageModal] Gửi tin nhắn thất bại:', err);
            setError(err?.response?.data?.message || 'Gửi tin nhắn thất bại. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!mounted) return null;

    return createPortal(

        <div
            className="m-overlay fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="m-sheet bg-white w-full max-w-[440px] rounded-[20px] shadow-2xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors p-1.5 bg-white hover:bg-gray-100 rounded-full z-10"
                >
                    <X size={18} strokeWidth={2} />
                </button>

                <div className="p-6">
                    {/* BƯỚC 1: CHỌN NGƯỜI NHẬN */}
                    {step === 'choose' && (
                        <>
                            <h2 className="text-[18px] font-bold text-gray-900 mb-1.5">Viết tin nhắn</h2>
                            <p className="text-[13px] text-gray-500 mb-6">
                                Bạn muốn gửi tin nhắn này cho ai?
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleChooseTarget('ADMIN')}
                                    className="flex items-center gap-3.5 p-4 border border-gray-200 rounded-2xl hover:border-[#E89B5A] hover:bg-[#FFF8F0] transition-colors text-left"
                                >
                                    <div className="w-11 h-11 rounded-full bg-[#EBFFE2] flex items-center justify-center shrink-0">
                                        <ShieldCheck size={20} className="text-[#77C852]" />
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-semibold text-gray-900">Gửi cho Admin</p>
                                        <p className="text-[12px] text-gray-500">Vấn đề vận hành, tài khoản, hồ sơ...</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleChooseTarget('DEVELOPER')}
                                    className="flex items-center gap-3.5 p-4 border border-gray-200 rounded-2xl hover:border-[#E89B5A] hover:bg-[#FFF8F0] transition-colors text-left"
                                >
                                    <div className="w-11 h-11 rounded-full bg-[#E8F1FF] flex items-center justify-center shrink-0">
                                        <Code2 size={20} className="text-[#5A90DA]" />
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-semibold text-gray-900">Gửi cho Developer</p>
                                        <p className="text-[12px] text-gray-500">Báo lỗi hệ thống, đề xuất tính năng...</p>
                                    </div>
                                </button>
                            </div>
                        </>
                    )}

                    {/* BƯỚC 2: FORM NHẬP THÔNG TIN */}
                    {step === 'form' && target && (
                        <>
                            <button
                                type="button"
                                onClick={handleBack}
                                className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-[12px] font-medium mb-4 transition-colors"
                            >
                                <ArrowLeft size={14} /> Quay lại
                            </button>

                            <h2 className="text-[18px] font-bold text-gray-900 mb-1.5">
                                Gửi tin nhắn cho {target === 'ADMIN' ? 'Admin' : 'Developer'}
                            </h2>
                            <p className="text-[13px] text-gray-500 mb-5">
                                Điền thông tin dưới đây, chúng mình sẽ phản hồi qua email của bạn.
                            </p>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                                <div>
                                    <label className="text-[12px] font-medium text-gray-600 block mb-1.5">Họ tên</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Nguyễn Văn A"
                                        className="w-full bg-[#F9FAFB] border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#E89B5A] transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="text-[12px] font-medium text-gray-600 block mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="ban@email.com"
                                        className="w-full bg-[#F9FAFB] border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#E89B5A] transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="text-[12px] font-medium text-gray-600 block mb-1.5">Tiêu đề</label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Tóm tắt ngắn về vấn đề của bạn"
                                        className="w-full bg-[#F9FAFB] border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#E89B5A] transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="text-[12px] font-medium text-gray-600 block mb-1.5">Nội dung</label>
                                    <textarea
                                        rows={4}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Mô tả chi tiết nội dung bạn muốn gửi..."
                                        className="w-full bg-[#F9FAFB] border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#E89B5A] transition-colors resize-none"
                                    />
                                </div>

                                {error && <p className="text-[12px] text-red-500">{error}</p>}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="mt-1.5 w-full bg-[#E89B5A] hover:bg-[#D68B4E] disabled:opacity-60 transition-colors text-white font-bold text-[14px] py-3 rounded-xl shadow-sm shadow-orange-100 flex items-center justify-center gap-2"
                                >
                                    <Send size={15} />
                                    {isSubmitting ? 'Đang gửi...' : 'Gửi tin nhắn'}
                                </button>
                            </form>
                        </>
                    )}

                    {/* BƯỚC 3: THÀNH CÔNG */}
                    {step === 'success' && (
                        <div className="flex flex-col items-center text-center py-4">
                            <div className="w-14 h-14 rounded-full bg-[#EBFFE2] flex items-center justify-center mb-4">
                                <Send size={22} className="text-[#77C852]" />
                            </div>
                            <h2 className="text-[16px] font-bold text-gray-900 mb-1.5">Đã gửi thành công!</h2>
                            <p className="text-[13px] text-gray-500 mb-6">
                                Tin nhắn của bạn đã được gửi tới{' '}
                                {target === 'ADMIN' ? 'Admin' : 'Developer'}. Chúng mình sẽ phản hồi qua email sớm nhất.
                            </p>
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full bg-[#E89B5A] hover:bg-[#D68B4E] transition-colors text-white font-bold text-[14px] py-3 rounded-xl shadow-sm shadow-orange-100"
                            >
                                Đóng
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};