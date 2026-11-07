// src/lib/upload/uploadToR2.ts
import { apiClient } from '@/lib/api/ApiClient';

interface UploadOptions {
  folder: string; // 'shelters', 'pets', 'avatars'...
}

export async function uploadFileToR2(file: File, options: UploadOptions): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileType = file.type || (ext === 'png' ? 'image/png' : 'image/jpeg');

  // 1. Xin presigned URL từ backend — dùng đúng endpoint mobile đang gọi
  const { uploadUrl, fileUrl } = await apiClient.post<{ uploadUrl: string; fileUrl: string }>(
    '/storage/presigned-url',
    { fileName: file.name, fileType, folder: options.folder },
  );

  // 2. Upload trực tiếp lên Cloudflare R2, KHÔNG qua backend
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': fileType },
  });

  if (!uploadRes.ok) {
    throw new Error(`Upload to Cloudflare R2 failed: ${uploadRes.status}`);
  }

  // 3. Trả về URL công khai để lưu vào avatarUrl/coverUrl
  return fileUrl;
}