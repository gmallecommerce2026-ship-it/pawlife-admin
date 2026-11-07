"use client";

import { register } from "@/actions/register"; // Action bạn đã tạo ở bài trước
import { useState, useTransition } from "react";

export default function TestRegisterPage() {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    setError("");
    setSuccess("");
    
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    startTransition(() => {
      register({ email, password, name })
        .then((data) => {
          setError(data.error);
          setSuccess(data.success);
        });
    });
  };

  return (
    <div className="p-10 border max-w-md mx-auto mt-10">
      <h1 className="text-xl font-bold mb-4">Test Đăng ký (Create User)</h1>
      <form action={onSubmit} className="flex flex-col gap-4">
        <input name="name" placeholder="Tên" className="border p-2" required />
        <input name="email" placeholder="Email" type="email" className="border p-2" required />
        <input name="password" placeholder="Mật khẩu (min 6)" type="password" className="border p-2" required />
        
        <button disabled={isPending} type="submit" className="bg-blue-500 text-white p-2">
          {isPending ? "Đang tạo..." : "Tạo User"}
        </button>
      </form>
      {success && <p className="text-green-500 mt-2">{success}</p>}
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}