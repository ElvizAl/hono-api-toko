import { z } from "zod";

// Schema untuk membuat review
export const createReviewSchema = z.object({
	rating: z.coerce
		.number()
		.min(1, "Rating minimal 1")
		.max(5, "Rating maksimal 5"),
	comment: z.string().optional(),
});

// Schema untuk update review
export const updateReviewSchema = z.object({
	rating: z.coerce
		.number()
		.min(1, "Rating minimal 1")
		.max(5, "Rating maksimal 5")
		.optional(),
	comment: z.string().optional(),
});

// Schema untuk query reviews
export const reviewQuerySchema = z.object({
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(10),
	productId: z.string().optional(),
	userId: z.string().optional(),
	minRating: z.coerce.number().min(1).max(5).optional(),
	maxRating: z.coerce.number().min(1).max(5).optional(),
	sortBy: z.enum(["rating", "createdAt"]).default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ReviewQueryInput = z.infer<typeof reviewQuerySchema>;
