import { z } from "zod";

export const userQuerySchema = z.object({
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(10),
	search: z.string().optional(),
});

export const updateUserSchema = z.object({
	name: z.string().min(2, { message: "Nama minimal 2 karakter" }).optional(),
	email: z.email({ message: "Email tidak valid" }).optional(),
	role: z.enum(["USER", "ADMIN"]).optional(),
});

export const banUserSchema = z.object({
	onBanned: z.boolean({ message: "Status banned harus berupa boolean" }),
});

export type UserQueryInput = z.infer<typeof userQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type BanUserInput = z.infer<typeof banUserSchema>;
