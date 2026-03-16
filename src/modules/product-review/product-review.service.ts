import { HTTPException } from "hono/http-exception";
import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../utils/prisma";
import type {
	CreateReviewInput,
	ReviewQueryInput,
	UpdateReviewInput,
} from "./product-review.schema";

// Get semua reviews dengan pagination dan filtering (Admin only)
export const getAllReviewsService = async (query: ReviewQueryInput) => {
	const {
		page,
		limit,
		productId,
		userId,
		minRating,
		maxRating,
		sortBy,
		sortOrder,
	} = query;

	// Build where clause
	const where: Prisma.ProductReviewWhereInput = {};

	if (productId) {
		where.productId = productId;
	}

	if (userId) {
		where.userId = userId;
	}

	if (minRating !== undefined || maxRating !== undefined) {
		where.rating = {};
		if (minRating !== undefined) where.rating.gte = minRating;
		if (maxRating !== undefined) where.rating.lte = maxRating;
	}

	// Hitung total reviews
	const total = await prisma.productReview.count({ where });

	// Hitung pagination
	const skip = (page - 1) * limit;
	const totalPages = Math.ceil(total / limit);

	// Get reviews
	const reviews = await prisma.productReview.findMany({
		where,
		skip,
		take: limit,
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					avatarUrl: true,
				},
			},
			product: {
				select: {
					id: true,
					name: true,
					slug: true,
					imageUrl: true,
				},
			},
		},
		orderBy: {
			[sortBy]: sortOrder,
		},
	});

	return {
		success: true,
		message: "Berhasil mengambil semua reviews",
		data: {
			reviews,
			pagination: {
				page,
				limit,
				total,
				totalPages,
				hasNextPage: page < totalPages,
				hasPrevPage: page > 1,
			},
		},
	};
};

// Get review by ID
export const getReviewByIdService = async (id: string) => {
	const review = await prisma.productReview.findUnique({
		where: { id },
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					avatarUrl: true,
				},
			},
			product: {
				select: {
					id: true,
					name: true,
					slug: true,
					imageUrl: true,
					category: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			},
		},
	});

	if (!review) {
		throw new HTTPException(404, { message: "Review tidak ditemukan" });
	}

	return {
		success: true,
		message: "Berhasil mengambil review",
		data: review,
	};
};

// Get reviews by product (Public)
export const getProductReviewsService = async (
	productId: string,
	query: ReviewQueryInput,
) => {
	const { page, limit, minRating, maxRating, sortBy, sortOrder } = query;

	// Check if product exists
	const product = await prisma.product.findUnique({
		where: { id: productId },
	});

	if (!product) {
		throw new HTTPException(404, { message: "Produk tidak ditemukan" });
	}

	// Build where clause
	const where: Prisma.ProductReviewWhereInput = {
		productId,
	};

	if (minRating !== undefined || maxRating !== undefined) {
		where.rating = {};
		if (minRating !== undefined) where.rating.gte = minRating;
		if (maxRating !== undefined) where.rating.lte = maxRating;
	}

	// Hitung total reviews
	const total = await prisma.productReview.count({ where });

	// Hitung pagination
	const skip = (page - 1) * limit;
	const totalPages = Math.ceil(total / limit);

	// Get reviews
	const reviews = await prisma.productReview.findMany({
		where,
		skip,
		take: limit,
		include: {
			user: {
				select: {
					id: true,
					name: true,
					avatarUrl: true,
				},
			},
		},
		orderBy: {
			[sortBy]: sortOrder,
		},
	});

	// Hitung average rating
	const ratingStats = await prisma.productReview.aggregate({
		where: { productId },
		_count: true,
		_avg: {
			rating: true,
		},
	});

	return {
		success: true,
		message: "Berhasil mengambil review produk",
		data: {
			productId,
			productName: product.name,
			reviews,
			ratingStats: {
				totalReviews: ratingStats._count,
				averageRating: ratingStats._avg.rating || 0,
			},
			pagination: {
				page,
				limit,
				total,
				totalPages,
				hasNextPage: page < totalPages,
				hasPrevPage: page > 1,
			},
		},
	};
};

// Create review (Auth required)
export const createReviewService = async (
	userId: string,
	productId: string,
	input: CreateReviewInput,
) => {
	const { rating, comment } = input;

	// Check if product exists
	const product = await prisma.product.findUnique({
		where: { id: productId },
	});

	if (!product) {
		throw new HTTPException(404, { message: "Produk tidak ditemukan" });
	}

	// Check if user already reviewed this product
	const existingReview = await prisma.productReview.findFirst({
		where: {
			userId,
			productId,
		},
	});

	if (existingReview) {
		throw new HTTPException(409, {
			message: "Anda sudah memberikan review untuk produk ini",
		});
	}

	const review = await prisma.productReview.create({
		data: {
			rating,
			comment,
			userId,
			productId,
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					avatarUrl: true,
				},
			},
			product: {
				select: {
					id: true,
					name: true,
					slug: true,
					imageUrl: true,
				},
			},
		},
	});

	return {
		success: true,
		message: "Berhasil membuat review",
		data: review,
	};
};

// Update review (Only own review or admin)
export const updateReviewService = async (
	id: string,
	userId: string | undefined,
	userRole: string,
	input: UpdateReviewInput,
) => {
	// Check if review exists
	const review = await prisma.productReview.findUnique({
		where: { id },
	});

	if (!review) {
		throw new HTTPException(404, { message: "Review tidak ditemukan" });
	}

	// Check permission: only own review or admin
	if (review.userId !== userId && userRole !== "ADMIN") {
		throw new HTTPException(403, {
			message: "Anda tidak memiliki akses untuk mengupdate review ini",
		});
	}

	const { rating, comment } = input;

	const updatedReview = await prisma.productReview.update({
		where: { id },
		data: {
			...(rating !== undefined && { rating }),
			...(comment !== undefined && { comment }),
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					avatarUrl: true,
				},
			},
			product: {
				select: {
					id: true,
					name: true,
					slug: true,
					imageUrl: true,
				},
			},
		},
	});

	return {
		success: true,
		message: "Berhasil memperbarui review",
		data: updatedReview,
	};
};

// Delete review (Only own review or admin)
export const deleteReviewService = async (
	id: string,
	userId: string | undefined,
	userRole: string,
) => {
	// Check if review exists
	const review = await prisma.productReview.findUnique({
		where: { id },
	});

	if (!review) {
		throw new HTTPException(404, { message: "Review tidak ditemukan" });
	}

	// Check permission: only own review or admin
	if (review.userId !== userId && userRole !== "ADMIN") {
		throw new HTTPException(403, {
			message: "Anda tidak memiliki akses untuk menghapus review ini",
		});
	}

	await prisma.productReview.delete({
		where: { id },
	});

	return {
		success: true,
		message: "Berhasil menghapus review",
	};
};
