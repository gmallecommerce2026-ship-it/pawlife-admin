// src/services/SellerAuthService.ts
import { apiClient } from '@/lib/api/ApiClient';

export const SellerAuthService = {
  // Đăng ký tài khoản Seller mới (bao gồm cả upload file)
  async registerSeller(formData: FormData) {
    // Content-Type là multipart/form-data sẽ được apiClient (hoặc axios) tự động xử lý
    return apiClient.post('/seller/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Kiểm tra trạng thái hồ sơ (Dùng nếu đăng nhập nhưng chưa được duyệt)
  async checkApplicationStatus(email: string) {
    return apiClient.get(`/seller/auth/application-status?email=${email}`);
  }
};