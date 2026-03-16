import { HTTPException } from "hono/http-exception";
import slugify from "slugify";
import type { Prisma } from "../../generated/prisma/client";
import { uploadImageToCloudinary } from "../../utils/cloudinary";
import { prisma } from "../../utils/prisma";
import type {
	ProductInput,
	ProductQueryInput,
	UpdateStockInput,
} from "./product.schema";

export const getAllProductsService = async (query: ProductQueryInput) => {
	const {
		page,
		limit,
		search,
		categoryId,
		minPrice,
		maxPrice,
		minStock,
		maxStock,
		sortBy,
		sortOrder,
	} = query;

	// Build where clause untuk filtering
	const where: Prisma.ProductWhereInput = {};

	if (search) {
		where.OR = [
			{ name: { contains: search, mode: "insensitive" } },
			{ slug: { contains: search, mode: "insensitive" } },
			{ description: { contains: search, mode: "insensitive" } },
		];
	}

	if (categoryId) {
		where.categoryId = categoryId;
	}

	if (minPrice !== undefined || maxPrice !== undefined) {
		where.price = {};
		if (minPrice !== undefined) where.price.gte = minPrice;
		if (maxPrice !== undefined) where.price.lte = maxPrice;
	}

	if (minStock !== undefined || maxStock !== undefined) {
		where.stock = {};
		if (minStock !== undefined) where.stock.gte = minStock;
		if (maxStock !== undefined) where.stock.lte = maxStock;
	}

	// Hitung total products
	const total = await prisma.product.count({ where });

	// Hitung pagination
	const skip = (page - 1) * limit;
	const totalPages = Math.ceil(total / limit);

	// Get products dengan pagination, filtering, dan sorting
	const products = await prisma.product.findMany({
		where,
		skip,
		take: limit,
		include: {
			category: {
				select: {
					id: true,
					name: true,
				},
			},
			_count: {
				select: {
					reviews: true,
				},
			},
		},
		orderBy: {
			[sortBy]: sortOrder,
		},
	});

	return {
		success: true,
		message: "Berhasil mengambil semua produk",
		data: {
			products,
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

export const getProductByIdService = async (id: string) => {
	const product = await prisma.product.findUnique({
		where: { id },
		include: {
			category: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	});

	if (!product) {
		throw new HTTPException(404, { message: "Produk tidak ditemukan" });
	}

	return {
		success: true,
		message: "Berhasil mengambil produk",
		data: product,
	};
};

export const createProductService = async (input: ProductInput) => {
	const { name, slug, categoryId, price, weight, stock, description, image } =
		input;

	// Check if category exists
	const categoryExists = await prisma.category.findUnique({
		where: { id: categoryId },
	});

	if (!categoryExists) {
		throw new HTTPException(404, { message: "Kategori tidak ditemukan" });
	}

	// Generate slug from name if not provided
	const productSlug = slug || slugify(name, { lower: true });

	// Check if slug is already used
	const slugExists = await prisma.product.findFirst({
		where: { slug: productSlug },
	});

	if (slugExists) {
		throw new HTTPException(409, { message: "Slug produk sudah digunakan" });
	}

	let imageUrl: string | undefined;

	// Handle image upload if provided
	if (image && image.size > 0) {
		try {
			const arrayBuffer = await image.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);
			imageUrl = await uploadImageToCloudinary(buffer, "hono-toko/products");
		} catch (error) {
			console.error("Error uploading image:", error);
			throw new HTTPException(500, {
				message: "Gagal mengunggah gambar produk",
			});
		}
	}

	const product = await prisma.product.create({
		data: {
			name,
			slug: productSlug,
			categoryId,
			price,
			weight,
			stock,
			description,
			imageUrl,
		},
	});

	return {
		success: true,
		message: "Berhasil membuat produk baru",
		data: product,
	};
};

export const updateProductService = async (id: string, input: ProductInput) => {
	const { name, slug, categoryId, price, weight, stock, description, image } =
		input;

	// Check if product exists
	const existingProduct = await prisma.product.findUnique({
		where: { id },
	});

	if (!existingProduct) {
		throw new HTTPException(404, { message: "Produk tidak ditemukan" });
	}

	// Check if category exists
	if (categoryId !== existingProduct.categoryId) {
		const categoryExists = await prisma.category.findUnique({
			where: { id: categoryId },
		});

		if (!categoryExists) {
			throw new HTTPException(404, { message: "Kategori tidak ditemukan" });
		}
	}

	// Generate slug from name if not provided
	const productSlug = slug || slugify(name, { lower: true });

	// Check if slug is used by another product
	if (productSlug !== existingProduct.slug) {
		const slugExists = await prisma.product.findFirst({
			where: { slug: productSlug, id: { not: id } },
		});

		if (slugExists) {
			throw new HTTPException(409, { message: "Slug produk sudah digunakan" });
		}
	}

	let imageUrl = existingProduct.imageUrl;

	// Handle new image upload if provided
	if (image && image.size > 0) {
		try {
			const arrayBuffer = await image.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);
			imageUrl = await uploadImageToCloudinary(buffer, "hono-toko/products");

			// Note: We could optionally delete the old image from Cloudinary here
			// using deleteImageFromCloudinary if imageUrl and existingProduct.imageUrl differ
		} catch (error) {
			console.error("Error uploading new image:", error);
			throw new HTTPException(500, {
				message: "Gagal mengunggah gambar produk",
			});
		}
	}

	const product = await prisma.product.update({
		where: { id },
		data: {
			name,
			slug: productSlug,
			categoryId,
			price,
			weight,
			stock,
			description,
			imageUrl,
		},
	});

	return {
		success: true,
		message: "Berhasil memperbarui produk",
		data: product,
	};
};

export const deleteProductService = async (id: string) => {
	const product = await prisma.product.findUnique({
		where: { id },
	});

	if (!product) {
		throw new HTTPException(404, { message: "Produk tidak ditemukan" });
	}

	await prisma.product.delete({
		where: { id },
	});

	// Note: We could optionally delete the image from Cloudinary here
	// using deleteImageFromCloudinary

	return {
		success: true,
		message: "Berhasil menghapus produk",
	};
};

// Update stock produk saja
export const updateProductStockService = async (
	id: string,
	input: UpdateStockInput,
) => {
	const { stock } = input;

	// Check if product exists
	const product = await prisma.product.findUnique({
		where: { id },
	});

	if (!product) {
		throw new HTTPException(404, { message: "Produk tidak ditemukan" });
	}

	const updatedProduct = await prisma.product.update({
		where: { id },
		data: { stock },
	});

	return {
		success: true,
		message: "Berhasil memperbarui stok produk",
		data: updatedProduct,
	};
};

// Get products dengan stock rendah
export const getLowStockProductsService = async (threshold: number = 5) => {
	const products = await prisma.product.findMany({
		where: {
			stock: {
				lte: threshold,
			},
		},
		include: {
			category: {
				select: {
					id: true,
					name: true,
				},
			},
		},
		orderBy: {
			stock: "asc",
		},
	});

	return {
		success: true,
		message: `Berhasil mengambil produk dengan stok rendah (${threshold} atau kurang)`,
		data: {
			products,
			count: products.length,
			threshold,
		},
	};
};
