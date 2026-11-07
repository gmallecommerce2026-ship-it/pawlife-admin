"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { LoginSchema } from "@/schemas";
import { login } from "@/actions/login";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

export const LoginForm = () => {
  const [error, setError] = useState<string | undefined>("");
  const [loading, setLoading] = useState(false); // Dùng state thường thay vì useTransition để test
  const searchParams = useSearchParams();
  const { update } = useSession();
  
  const callbackUrl = searchParams.get("callbackUrl");
  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Hàm xử lý chính
  const handleLoginProcess = async (values: z.infer<typeof LoginSchema>) => {
    // 1. Reset lỗi & Bật loading
    setError("");
    setLoading(true);

    try {
      // 2. Gọi Server Action
      const data = await login(values, callbackUrl);

      // 3. Xử lý kết quả
      if (data?.error) {
        setError(data.error);
        alert(`❌ Lỗi từ Server: ${data.error}`);
      } 
      
      if (data?.success) {
        // Thông báo thành công (Để bạn biết code đã chạy đến đây)
        // alert("✅ Đăng nhập thành công! Nhấn OK để chuyển trang.");
        
        // 4. Update session
        await update();
        
        // 5. Hard Reload (Chìa khóa để fix lỗi Header)
        const destination = data.redirectTo || "/";
        window.location.assign(destination);
      }
    } catch (err) {
      alert("💥 Lỗi kết nối! Xem console trình duyệt để biết thêm.");
      console.error(err);
      setError("Lỗi hệ thống");
    } finally {
      setLoading(false);
    }
  };

  // Hàm wrapper để chặn Enter reload trang
  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    handleLoginProcess(values);
  };

  return (
    <div className="max-w-md mx-auto border p-5 rounded shadow bg-white">
       {/* Dùng thẻ div thay vì form để chặn tuyệt đối hành vi reload mặc định 
          khi nhấn Enter hoặc Button
       */}
       <div 
         className="space-y-4"
         onKeyDown={(e) => {
           if (e.key === "Enter") {
             e.preventDefault(); // Chặn reload
             form.handleSubmit(onSubmit)(); // Submit thủ công
           }
         }}
       >
          <div className="space-y-2">
            <input 
              {...form.register("email")}
              placeholder="Email" 
              type="email"
              disabled={loading}
              className="w-full border p-2 rounded text-black"
            />
             {form.formState.errors.email && <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <input 
              {...form.register("password")}
              placeholder="Mật khẩu" 
              type="password"
              disabled={loading}
              className="w-full border p-2 rounded text-black"
            />
             {form.formState.errors.password && <p className="text-red-500 text-sm">{form.formState.errors.password.message}</p>}
          </div>

          {error && <div className="bg-red-100 text-red-500 p-2 rounded text-sm">{error}</div>}

          <button 
              type="button" // Quan trọng: type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={loading}
              className="w-full bg-black text-white p-2 rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
       </div>
    </div>
  );
};