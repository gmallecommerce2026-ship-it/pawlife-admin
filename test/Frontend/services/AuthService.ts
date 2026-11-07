import { apiClient } from '@/lib/api/ApiClient';
import { useUserStore } from '@/store/useUserStore';
import { useChatStore } from '@/store/useChatStore';
export const AuthService = {
  // Gửi OTP
  async sendOtp(email: string) {
    return apiClient.post('/auth/send-otp', { email });
  },

  // Xác thực OTP -> Login
  async verifyOtp(email: string, otp: string) {
    const res = await apiClient.post('/auth/verify-otp', { email, otp });
    
    if (res?.access_token) {
      // 1. Lưu Token
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', res.access_token);
        // Cookie dùng cho Middleware chặn route
        document.cookie = `token=${res.access_token}; path=/; max-age=86400;`; 
      }
      
      // 2. Lưu User vào Store ngay lập tức
      useUserStore.getState().setUser(res.user);
      return res.user;
    }
    throw new Error('Xác thực thất bại');
  },

  // Lấy thông tin user hiện tại (Dùng khi F5 trang)
  async getMe() {
    try {
      const user = await apiClient.get('/auth/me');
      if (user) {
        useUserStore.getState().setUser(user);
        return user;
      }
    } catch (error) {
      console.error("Lỗi lấy thông tin user:", error);
      // Nếu token hết hạn, tự động logout
      this.logout(); 
    }
    return null;
  },

  // Đăng xuất
  logout() {
    // 1. Ngắt kết nối Chat & Xóa dữ liệu Chat Store
    useChatStore.getState().disconnectSocket();

    // 2. Xóa Token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('tracking_device_id'); // Nếu muốn reset luôn tracking
      document.cookie = 'token=; path=/; max-age=0;'; 
    }

    // 3. Clear User Store
    useUserStore.getState().logout();

    // 4. Redirect
    window.location.href = '/login';
  }
};