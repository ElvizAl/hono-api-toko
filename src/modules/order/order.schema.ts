import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
];

// Item dalam order
export const orderItemSchema = z.object({
	productId: z.string().min(1, "Product ID harus diisi"),
	quantity: z.coerce.number().min(1, "Quantity minimal 1"),
});

// Create order
export const createOrderSchema = z.object({
	items: z.array(orderItemSchema).min(1, "Minimal 1 item"),
	shippingCost: z.coerce.number().min(0, "Ongkos kirim tidak boleh negatif"),
	courier: z.string().min(1, "Kurir harus dipilih"),
	paymentType: z.enum(["TRANSFER", "EWALLET"], {
		message: "Tipe pembayaran tidak valid",
	}),
	proofImage: z
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

// Update order status (Admin only)
export const updateOrderStatusSchema = z.object({
	status: z.enum(["PENDING", "PAID", "CANCELLED"], {
		message: "Status tidak valid",
	}),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
