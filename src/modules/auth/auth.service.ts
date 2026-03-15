import { HTTPException } from "hono/http-exception";
import { VerificationPurpose } from "../../generated/prisma/enums";
import { sendOtpEmail, upsertVerificationCode } from "../../lib/email";
import {
	hashPassword,
	hashToken,
	verifyPassword,
	verifyToken,
} from "../../utils/hash";
import {
	signAccessToken,
	signRefreshToken,
	verifyRefreshToken,
} from "../../utils/jwt";
import { prisma } from "../../utils/prisma";
import type {
	ForgotPasswordInput,
	LoginInput,
	RegisterInput,
	ResetPasswordInput,
	VerifyEmailOtpInput,
} from "./auth.schema";

export async function registerService(data: RegisterInput) {
	const existingUser = await prisma.user.findUnique({
		where: { email: data.email },
	});

	if (existingUser) {
		throw new HTTPException(400, { message: "Email sudah terdaftar" });
	}

	const passwordHash = await hashPassword(data.password);

	const user = await prisma.user.create({
		data: {
			name: data.name,
			email: data.email,
			password: passwordHash,
			isVerified: data.isVerified,
		},
	});

	const verificationCode = await upsertVerificationCode(
		user.id,
		VerificationPurpose.VERIFY_EMAIL,
	);

	await sendOtpEmail({
		email: user.email,
		code: verificationCode.code,
		purpose: VerificationPurpose.VERIFY_EMAIL,
	});

	return {
		message: "Register berhasil, silahkan verifikasi email OTP",
		user: {
			id: user.id,
			name: user.name,
			email: user.email,
			isVerified: user.isVerified,
		},
	};
}

export async function verifyEmailOtpService(data: VerifyEmailOtpInput) {
	const user = await prisma.user.findUnique({ where: { email: data.email } });

	if (!user) {
		throw new HTTPException(404, { message: "User tidak ditemukan" });
	}

	const verificationCode = await prisma.verificationCode.findUnique({
		where: {
			userId: user.id,
			purpose: VerificationPurpose.VERIFY_EMAIL,
		},
	});

	if (!verificationCode) {
		throw new HTTPException(404, {
			message: "Verification code tidak ditemukan",
		});
	}

	if (verificationCode.expiresAt < new Date()) {
		await prisma.verificationCode.delete({
			where: { id: verificationCode.id },
		});
		throw new HTTPException(400, {
			message: "Verifikasi kode sudah tidak berlaku",
		});
	}

	if (verificationCode.code !== data.code) {
		throw new HTTPException(400, { message: "Kode verifikasi tidak valid" });
	}

	await prisma.$transaction([
		prisma.user.update({
			where: { id: user.id },
			data: { isVerified: true },
		}),
		prisma.verificationCode.delete({
			where: { id: verificationCode.id },
		}),
	]);

	return { message: "Email berhasil diverifikasi" };
}

export async function resendVerificationOtpService(input: { email: string }) {
	const user = await prisma.user.findUnique({ where: { email: input.email } });

	if (!user) {
		throw new HTTPException(404, { message: "User tidak ditemukan" });
	}

	if (user.isVerified) {
		throw new HTTPException(400, { message: "Email sudah diverifikasi" });
	}

	const verificationCode = await upsertVerificationCode(
		user.id,
		VerificationPurpose.VERIFY_EMAIL,
	);
	await sendOtpEmail({
		email: user.email,
		code: verificationCode.code,
		purpose: VerificationPurpose.VERIFY_EMAIL,
	});

	return { message: "Verification OTP berhasil dikirim ulang" };
}

export async function loginService(data: LoginInput) {
	const existingUser = await prisma.user.findUnique({
		where: { email: data.email },
	});

	if (!existingUser) {
		throw new HTTPException(404, { message: "User tidak ditemukan" });
	}

	if (existingUser.onBanned) {
		throw new HTTPException(403, { message: "User dibanned" });
	}

	const isPasswordValid = await verifyPassword(
		data.password,
		existingUser.password as string,
	);

	if (!isPasswordValid) {
		throw new HTTPException(400, { message: "Email atau password salah" });
	}

	if (!existingUser.isVerified) {
		throw new HTTPException(403, { message: "Email belum diverifikasi" });
	}

	const accessToken = signAccessToken({
		sub: existingUser.id,
		email: existingUser.email,
		role: existingUser.role,
	});

	const refreshToken = signRefreshToken({
		sub: existingUser.id,
		type: "refresh",
	});

	const refreshTokenHash = hashToken(refreshToken);

	await prisma.user.update({
		where: { id: existingUser.id },
		data: {
			refreshToken: refreshTokenHash,
		},
	});

	return {
		message: "Login berhasil",
		accessToken,
		refreshToken,
	};
}

export async function refreshTokenService(refreshToken: string) {
	const payload = verifyRefreshToken(refreshToken);

	const user = await prisma.user.findUnique({ where: { id: payload.sub } });

	if (!user || !user.refreshToken) {
		throw new HTTPException(401, { message: "Session Tidak Valid" });
	}

	const isRefreshTokenValid = verifyToken(refreshToken, user.refreshToken);

	if (!isRefreshTokenValid) {
		throw new HTTPException(401, { message: "Session Tidak Valid" });
	}

	const accessToken = signAccessToken({
		sub: user.id,
		email: user.email,
		role: user.role,
	});

	const newRefreshToken = signRefreshToken({
		sub: user.id,
		type: "refresh",
	});

	const refreshTokenHash = hashToken(newRefreshToken);

	await prisma.user.update({
		where: { id: user.id },
		data: {
			refreshToken: refreshTokenHash,
		},
	});

	return {
		message: "Refresh Token berhasil",
		accessToken,
		refreshToken: newRefreshToken,
	};
}

export async function forgotPasswordService(data: ForgotPasswordInput) {
	const user = await prisma.user.findUnique({ where: { email: data.email } });

	if (!user) {
		throw new HTTPException(404, { message: "User tidak ditemukan" });
	}

	const verificationCode = await upsertVerificationCode(
		user.id,
		VerificationPurpose.RESET_PASSWORD,
	);
	await sendOtpEmail({
		email: user.email,
		code: verificationCode.code,
		purpose: VerificationPurpose.RESET_PASSWORD,
	});

	return { message: "Verification OTP berhasil dikirim ulang" };
}

export async function resetPasswordService(data: ResetPasswordInput) {
	const user = await prisma.user.findUnique({ where: { email: data.email } });

	if (!user) {
		throw new HTTPException(404, { message: "User tidak ditemukan" });
	}

	const verificationCode = await prisma.verificationCode.findUnique({
		where: {
			userId: user.id,
			purpose: VerificationPurpose.RESET_PASSWORD,
		},
	});

	if (!verificationCode) {
		throw new HTTPException(404, {
			message: "Verification code tidak ditemukan",
		});
	}

	if (verificationCode.expiresAt < new Date()) {
		await prisma.verificationCode.delete({
			where: { id: verificationCode.id },
		});
		throw new HTTPException(400, {
			message: "Verifikasi kode sudah tidak berlaku",
		});
	}

	if (verificationCode.code !== data.code) {
		throw new HTTPException(400, { message: "Kode verifikasi tidak valid" });
	}

	const passwordHash = await hashPassword(data.newPassword);

	await prisma.$transaction([
		prisma.user.update({
			where: { id: user.id },
			data: { password: passwordHash, refreshToken: null },
		}),
		prisma.verificationCode.delete({
			where: { id: verificationCode.id },
		}),
	]);

	return { message: "Password berhasil direset" };
}

export async function logoutService(refreshToken?: string) {
	if (!refreshToken) {
		return { message: "Logout berhasil" };
	}

	try {
		const payload = verifyRefreshToken(refreshToken);
		await prisma.user.update({
			where: { id: payload.sub },
			data: { refreshToken: null },
		});
	} catch {
		// abaikan token yang tidak valid saat logout
	}

	return { message: "Logout berhasil" };
}
