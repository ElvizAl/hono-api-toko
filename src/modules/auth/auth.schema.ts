import { z } from "zod";

export const registerSchema = z.object({
	name: z
		.string({ error: "Nama wajib diisi" })
		.min(2, { error: "Nama minimal 2 karakter" }),
	email: z.email({ error: "Email wajib diisi" }),
	password: z
		.string({ error: "Kata sandi wajib diisi" })
		.min(6, { error: "Kata sandi minimal 6 karakter" }),
	isVerified: z.boolean().default(false),
});

export const verifyEmailOtpSchema = z.object({
	email: z.email({ error: "Email wajib diisi" }),
	code: z
		.string({ error: "Kode OTP wajib diisi" })
		.length(6, { error: "Kode OTP harus 6 karakter" }),
});

export const resendVerificationOtpSchema = z.object({
	email: z.email({ error: "Email wajib diisi" }),
});

export const loginSchema = z.object({
	email: z.email({ error: "Email wajib diisi" }),
	password: z
		.string({ error: "Kata sandi wajib diisi" })
		.min(6, { error: "Kata sandi minimal 6 karakter" }),
});

export const forgotPasswordSchema = z.object({
	email: z.email({ error: "Email wajib diisi" }),
});

export const resetPasswordSchema = z.object({
	email: z.email({ error: "Email wajib diisi" }),
	code: z
		.string({ error: "Kode OTP wajib diisi" })
		.length(6, { error: "Kode OTP harus 6 karakter" }),
	newPassword: z
		.string({ error: "Kata sandi baru wajib diisi" })
		.min(6, { error: "Kata sandi baru minimal 6 karakter" }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyEmailOtpInput = z.infer<typeof verifyEmailOtpSchema>;
export type ResendVerificationOtpInput = z.infer<
	typeof resendVerificationOtpSchema
>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
