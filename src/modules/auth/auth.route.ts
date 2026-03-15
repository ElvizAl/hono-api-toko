import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { requireAuth } from "../../middleware/auth";
import {
	forgotPasswordSchema,
	loginSchema,
	registerSchema,
	resendVerificationOtpSchema,
	resetPasswordSchema,
	verifyEmailOtpSchema,
} from "./auth.schema";
import {
	forgotPasswordService,
	loginService,
	logoutService,
	refreshTokenService,
	registerService,
	resendVerificationOtpService,
	resetPasswordService,
	verifyEmailOtpService,
} from "./auth.service";

export const authRouter = new Hono()

	.post("/register", zValidator("json", registerSchema), async (c) => {
		const data = c.req.valid("json");
		const result = await registerService(data);
		return c.json(result, 201);
	})

	.post("/login", zValidator("json", loginSchema), async (c) => {
		const data = c.req.valid("json");
		const result = await loginService(data);
		return c.json(result, 200);
	})

	.post(
		"/verify-email",
		zValidator("json", verifyEmailOtpSchema),
		async (c) => {
			const data = c.req.valid("json");
			const result = await verifyEmailOtpService(data);
			return c.json(result, 200);
		},
	)

	.post(
		"/resend-otp",
		zValidator("json", resendVerificationOtpSchema),
		async (c) => {
			const data = c.req.valid("json");
			const result = await resendVerificationOtpService(data);
			return c.json(result, 200);
		},
	)

	.post(
		"/forgot-password",
		zValidator("json", forgotPasswordSchema),
		async (c) => {
			const data = c.req.valid("json");
			const result = await forgotPasswordService(data);
			return c.json(result, 200);
		},
	)

	.post(
		"/reset-password",
		zValidator("json", resetPasswordSchema),
		async (c) => {
			const data = c.req.valid("json");
			const result = await resetPasswordService(data);
			return c.json(result, 200);
		},
	)

	.post("/logout", requireAuth, async (c) => {
		const authHeader = c.req.header("Authorization");
		const token = authHeader?.split(" ")[1];

		const result = await logoutService(token as string);
		return c.json(result, 200);
	})

	.post("/refresh-token", requireAuth, async (c) => {
		const authHeader = c.req.header("Authorization");
		const refreshToken = authHeader?.split(" ")[1];

		if (!refreshToken) {
			throw new HTTPException(401, {
				message: "Unauthorized - Refresh Token Not Valid!",
			});
		}

		const result = await refreshTokenService(refreshToken);
		return c.json(result, 200);
	});
