import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
];

export const productSchema = z.object({
	name: z.string().min(3, "Nama produk minimal 3 karakter"),
	slug: z.string().optional(),
	categoryId: z.string().min(1, "Kategori harus dipilih"),
	price: z.coerce.number().min(0, "Harga tidak boleh negatif"),
	weight: z.coerce.number().min(0, "Berat tidak boleh negatif"),
	stock: z.coerce.number().min(0, "Stok tidak boleh negatif"),
	description: z.string().optional(),
	image: z
		.instanceof(File)
		.optional()
		.refine((file) => {
			if (!file) return true;
			return file.size <= MAX_FILE_SIZE;
		}, `Ukuran maksimal gambar adalah 5MB.`)
		.refine((file) => {
			if (!file) return true;
			return ACCEPTED_IMAGE_TYPES.includes(file.type);
		}, "Format gambar hanya boleh .jpg, .jpeg, .png, dan .webp"),
});

// Query schema untuk pagination, filtering, search, dan sort
export const productQuerySchema = z.object({
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(10),
	search: z.string().optional(),
	categoryId: z.string().optional(),
	minPrice: z.coerce.number().min(0).optional(),
	maxPrice: z.coerce.number().min(0).optional(),
	minStock: z.coerce.number().min(0).optional(),
	maxStock: z.coerce.number().min(0).optional(),
	sortBy: z.enum(["name", "price", "stock", "createdAt"]).default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Schema untuk update stock saja
export const updateStockSchema = z.object({
	stock: z.coerce.number().min(0, "Stok tidak boleh negatif"),
});

// Schema untuk low stock threshold
export const lowStockThresholdSchema = z.object({
	threshold: z.coerce.number().min(1, "Threshold minimal 1").default(5),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;
export type LowStockThresholdInput = z.infer<typeof lowStockThresholdSchema>;
