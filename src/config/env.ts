import { z } from "zod";

const envSchema = z.object({
	DATABASE_URL: z.string().url(),
	JWT_SECRET: z.string().min(1),
	JWT_REFRESH_SECRET: z.string().min(1),
	JWT_EXPIRES_IN: z.string().default("5m"),
	JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
	EMAIL_FROM: z.string().default(""),
	RESEND_API_KEY: z.string().default(""),
	OTP_EXPIRES_MINUTES: z.coerce.number().default(5),
});

export const env = envSchema.parse(process.env);
