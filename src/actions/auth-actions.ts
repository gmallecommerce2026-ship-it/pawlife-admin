'use server'

import { cookies } from 'next/headers';
import { z } from 'zod';
import { LoginSchema } from '@/schemas';

export async function loginWebAction(values: z.infer<typeof LoginSchema>) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');

    if (!apiUrl) {
        return { success: false, error: 'Cấu hình máy chủ bị thiếu (thiếu API URL)' };
    }

    try {
        const res = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // ĐÃ XÓA 'x-client-type': 'web' ĐỂ BACKEND KHÔNG CẮT MẤT TOKEN NỮA
                'x-device-name': 'NextJS Web App',
            },
            body: JSON.stringify(values),
        });

        const rawText = await res.text();
        let data: any = null;
        try {
            data = rawText ? JSON.parse(rawText) : {};
        } catch {
            return { success: false, error: `Máy chủ phản hồi không hợp lệ (status ${res.status})` };
        }

        if (res.status === 429) {
            return { success: false, error: 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút' };
        }

        if (!res.ok) {
            return { success: false, error: data.message || 'Đăng nhập thất bại' };
        }

        if (data.requires2FA) {
            return { success: false, requires2FA: true, tempToken: data.tempToken, error: data.message };
        }

        // Lấy token trực tiếp từ JSON do Backend trả về
        const token = data.accessToken;

        if (token) {
            const rememberMe = (values as any).rememberMe ?? false;
            const cookieStore = await cookies();
            
            // Set Cookie nội bộ cho môi trường SSR của Next.js
            cookieStore.set({
                name: 'accessToken',
                value: token,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
            });
        }

        // Trả token về cho Client Component (LoginPage)
        return { success: true, token: token, redirectTo: '/shelter/pets' };

    } catch (error: any) {
        const causeCode = error?.cause?.code;
        const causeMessage = error?.cause?.message || error?.cause;
        console.error('Login: lỗi fetch chi tiết:', { message: error.message, causeCode, causeMessage });
        return {
            success: false,
            error: `Lỗi kết nối đến máy chủ [${causeCode || 'unknown'}]: ${causeMessage || error.message}`,
        };
    }
}

export async function registerShelterAction(values: any) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, ''); // bỏ mọi dấu / thừa ở cuối

    if (!apiUrl) {
        return { success: false, error: 'Cấu hình máy chủ bị thiếu (thiếu API URL)' };
    }

    try {
        const res = await fetch(`${apiUrl}/auth/register-shelter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        });

        const rawText = await res.text();
        let data: any = null;
        try {
            data = rawText ? JSON.parse(rawText) : {};
        } catch {
            return { success: false, error: `Máy chủ phản hồi không hợp lệ (status ${res.status})` };
        }

        if (res.status === 429) {
            return { success: false, error: 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút' };
        }

        if (!res.ok) {
            console.log('Register: response lỗi, status:', res.status, 'data:', JSON.stringify(data));
            const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
            return { success: false, error: msg || 'Đăng ký thất bại' };
        }

        return { success: true };
    } catch (error: any) {
        // Lộ nguyên nhân thật thay vì chỉ "fetch failed"
        const causeCode = error?.cause?.code;
        const causeMessage = error?.cause?.message || error?.cause;
        console.error('Register: lỗi fetch chi tiết:', {
            message: error.message,
            causeCode,
            causeMessage,
            fullCause: error.cause,
        });

        return {
            success: false,
            error: `Lỗi kết nối đến máy chủ [${causeCode || 'unknown'}]: ${causeMessage || error.message}`,
        };
    }
}

export async function logoutWebAction() {
    const cookieStore = await cookies();
    cookieStore.delete('accessToken');
    return { success: true };
}