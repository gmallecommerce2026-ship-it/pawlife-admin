import * as z from "zod";

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email là bắt buộc",
  }),
  password: z.string().min(1, {
    message: "Mật khẩu là bắt buộc",
  }),
});

export const RegisterSchema = z.object({
  email: z.string().email({
    message: "Email là bắt buộc",
  }),
  password: z.string().min(6, {
    message: "Tối thiểu 6 ký tự",
  }),
  name: z.string().min(1, {
    message: "Tên là bắt buộc",
  }),
});

export const ShelterInfoSchema = z.object({
  phone: z.string().min(1, { message: "Số điện thoại là bắt buộc" }),
  address: z.string().min(1, { message: "Địa chỉ là bắt buộc" }),
  description: z.string().optional(),
  shelterType: z.string().optional(),
});