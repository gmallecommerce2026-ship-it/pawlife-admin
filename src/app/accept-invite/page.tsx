'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { shelterTeamService } from '@/services/shelterTeamService';
import { STAFF_ROLE_LABEL } from '@/types/shelterTeam';

type PreviewState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      email: string;
      role: keyof typeof STAFF_ROLE_LABEL;
      shelterName: string;
      shelterAvatarUrl?: string | null;
    };

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [preview, setPreview] = useState<PreviewState>({ status: 'loading' });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setPreview({ status: 'error', message: 'Thiếu token lời mời.' });
      return;
    }
    (async () => {
      try {
        const data = await shelterTeamService.getInvitationPreview(token);
        setPreview({
          status: 'ready',
          email: data.email,
          role: data.role,
          shelterName: data.shelterName,
          shelterAvatarUrl: data.shelterAvatarUrl,
        });
      } catch (err: any) {
        setPreview({
          status: 'error',
          message: err?.response?.data?.message || 'Lời mời không hợp lệ hoặc đã hết hạn.',
        });
      }
    })();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (password.length < 6) {
      setSubmitError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmitting(true);
    try {
      await shelterTeamService.acceptInvitation(token, password);
      setIsDone(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (preview.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-[#E89B5A]" size={32} />
      </div>
    );
  }

  if (preview.status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-[20px] shadow-sm p-8 max-w-[420px] w-full text-center">
          <XCircle className="mx-auto text-red-400 mb-3" size={40} />
          <h1 className="text-[18px] font-bold text-gray-900 mb-1">Không thể mở lời mời</h1>
          <p className="text-[14px] text-gray-500">{preview.message}</p>
        </div>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-[20px] shadow-sm p-8 max-w-[420px] w-full text-center">
          <CheckCircle2 className="mx-auto text-green-500 mb-3" size={40} />
          <h1 className="text-[18px] font-bold text-gray-900 mb-1">Kích hoạt thành công!</h1>
          <p className="text-[14px] text-gray-500">Đang chuyển đến trang đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-[20px] shadow-sm p-8 max-w-[420px] w-full">
        <h1 className="text-[20px] font-bold text-gray-900 mb-1">
          Tham gia {preview.shelterName}
        </h1>
        <p className="text-[13px] text-gray-500 mb-6">
          Bạn được mời với vai trò{' '}
          <span className="font-semibold text-[#E89B5A]">{STAFF_ROLE_LABEL[preview.role]}</span>
        </p>

        <div className="flex items-center gap-2.5 bg-[#F9FAFB] rounded-[10px] px-3.5 py-2.5 mb-5">
          <Mail size={16} className="text-gray-400 shrink-0" />
          <span className="text-[14px] text-gray-700">{preview.email}</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[12px] font-bold text-gray-500 mb-1.5 block">Mật khẩu</label>
            <div className="flex items-center gap-2.5 bg-[#F9FAFB] rounded-[10px] px-3.5 py-2.5 border border-transparent focus-within:border-[#E89B5A]">
              <Lock size={16} className="text-gray-400 shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full bg-transparent outline-none text-[14px] text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="text-[12px] font-bold text-gray-500 mb-1.5 block">Xác nhận mật khẩu</label>
            <div className="flex items-center gap-2.5 bg-[#F9FAFB] rounded-[10px] px-3.5 py-2.5 border border-transparent focus-within:border-[#E89B5A]">
              <Lock size={16} className="text-gray-400 shrink-0" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent outline-none text-[14px] text-gray-900"
              />
            </div>
          </div>

          {submitError && (
            <p className="text-[13px] text-red-500 bg-red-50 rounded-[8px] px-3 py-2">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-5 py-2.5 bg-[#E89B5A] hover:bg-[#D68B4E] text-white text-[14px] font-bold rounded-[10px] disabled:opacity-60 mt-2"
          >
            {isSubmitting ? 'Đang kích hoạt...' : 'Kích hoạt tài khoản'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="animate-spin text-[#E89B5A]" size={32} />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}