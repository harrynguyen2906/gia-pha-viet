import { z } from "zod";

export const registerSchema = z
  .object({
    displayName: z.string().min(2).max(100).trim(),
    email: z
      .string()
      .email("Email không hợp lệ")
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(8, "Tối thiểu 8 ký tự")
      .max(128)
      .regex(/[A-Z]/, "Cần ít nhất 1 chữ hoa")
      .regex(/[0-9]/, "Cần ít nhất 1 chữ số"),
    confirmPassword: z.string(),
    clanName: z.string().min(2).max(200).trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export const signInSchema = z.object({
  email: z.string().email("Email không hợp lệ").toLowerCase().trim(),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ").toLowerCase().trim(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8, "Tối thiểu 8 ký tự")
      .max(128)
      .regex(/[A-Z]/, "Cần ít nhất 1 chữ hoa")
      .regex(/[0-9]/, "Cần ít nhất 1 chữ số"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
