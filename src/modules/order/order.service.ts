import { HTTPException } from "hono/http-exception";
import { uploadImageToCloudinary } from "../../utils/cloudinary";
import { prisma } from "../../utils/prisma";
import type { CreateOrderInput, UpdateOrderStatusInput } from "./order.schema";

// Get all orders (Admin only)
export const getAllOrdersService = async () => {
	const orders = await prisma.order.findMany({
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
			items: {
				include: {
					product: {
						select: {
							id: true,
							name: true,
							imageUrl: true,
						},
					},
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return {
		success: true,
		message: "Berhasil mengambil semua pesanan",
		data: orders,
	};
};

// Get order by ID
export const getOrderByIdService = async (
	id: string,
	userId?: string,
	userRole?: string,
) => {
	const order = await prisma.order.findUnique({
		where: { id },
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
			items: {
				include: {
					product: {
						select: {
							id: true,
							name: true,
							slug: true,
							imageUrl: true,
							price: true,
							category: {
								select: {
									id: true,
									name: true,
								},
							},
						},
					},
				},
			},
		},
	});

	if (!order) {
		throw new HTTPException(404, { message: "Pesanan tidak ditemukan" });
	}

	// Check if user is authorized to view this order (only if userId and userRole provided)
	if (userId && userRole && userRole !== "ADMIN" && order.userId !== userId) {
		throw new HTTPException(403, {
			message: "Anda tidak berhak melihat pesanan ini",
		});
	}

	return {
		success: true,
		message: "Berhasil mengambil pesanan",
		data: order,
	};
};

// Get user's orders
export const getUserOrdersService = async (userId: string) => {
	const orders = await prisma.order.findMany({
		where: { userId },
		include: {
			items: {
				include: {
					product: {
						select: {
							id: true,
							name: true,
							slug: true,
							imageUrl: true,
						},
					},
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return {
		success: true,
		message: "Berhasil mengambil pesanan pengguna",
		data: orders,
	};
};

// Create order
export const createOrderService = async (
	userId: string,
	input: CreateOrderInput,
) => {
	const { items, shippingCost, courier, paymentType, proofImage } = input;

	// Validate and calculate totals
	let totalPrice = 0;
	const orderItems = [];

	// Validate products and calculate total
	for (const item of items) {
		const product = await prisma.product.findUnique({
			where: { id: item.productId },
		});

		if (!product) {
			throw new HTTPException(404, {
				message: `Produk dengan ID ${item.productId} tidak ditemukan`,
			});
		}

		if (product.stock < item.quantity) {
			throw new HTTPException(400, {
				message: `Stok produk ${product.name} tidak mencukupi. Tersisa: ${product.stock}`,
			});
		}

		const itemSubtotal = Number(product.price) * item.quantity;
		totalPrice += itemSubtotal;

		orderItems.push({
			productId: item.productId,
			quantity: item.quantity,
			price: product.price,
			subtotal: itemSubtotal,
		});
	}

	// Calculate grand total
	const grandTotal = totalPrice + shippingCost;

	// Handle proof image upload if provided
	let proofImageUrl: string | undefined;
	if (proofImage && proofImage.size > 0) {
		try {
			const arrayBuffer = await proofImage.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);
			proofImageUrl = await uploadImageToCloudinary(
				buffer,
				"hono-toko/payments",
			);
		} catch (error) {
			console.error("Error uploading proof image:", error);
			throw new HTTPException(500, {
				message: "Gagal mengunggah bukti pembayaran",
			});
		}
	}

	// Create order with items
	const order = await prisma.order.create({
		data: {
			userId,
			totalPrice,
			shippingCost,
			grandTotal,
			courier,
			paymentType,
			proofImage: proofImageUrl,
			items: {
				create: orderItems,
			},
		},
		include: {
			items: {
				include: {
					product: {
						select: {
							id: true,
							name: true,
							imageUrl: true,
						},
					},
				},
			},
		},
	});

	// Update product stock
	for (const item of items) {
		await prisma.product.update({
			where: { id: item.productId },
			data: {
				stock: {
					decrement: item.quantity,
				},
			},
		});
	}

	return {
		success: true,
		message: "Berhasil membuat pesanan",
		data: order,
	};
};

// Update order status (Admin only)
export const updateOrderStatusService = async (
	id: string,
	input: UpdateOrderStatusInput,
) => {
	const { status } = input;

	// Check if order exists
	const existingOrder = await prisma.order.findUnique({
		where: { id },
	});

	if (!existingOrder) {
		throw new HTTPException(404, { message: "Pesanan tidak ditemukan" });
	}

	// If cancelling order, restore stock
	if (status === "CANCELLED" && existingOrder.status !== "CANCELLED") {
		// Get all items in the order
		const orderItems = await prisma.orderItem.findMany({
			where: { orderId: id },
		});

		// Restore stock for each item
		for (const item of orderItems) {
			await prisma.product.update({
				where: { id: item.productId },
				data: {
					stock: {
						increment: item.quantity,
					},
				},
			});
		}
	}

	// If order was cancelled and now being paid, deduct stock again
	if (status === "PAID" && existingOrder.status === "CANCELLED") {
		const orderItems = await prisma.orderItem.findMany({
			where: { orderId: id },
		});

		for (const item of orderItems) {
			const product = await prisma.product.findUnique({
				where: { id: item.productId },
			});

			if (!product || product.stock < item.quantity) {
				throw new HTTPException(400, {
					message: `Stok produk tidak mencukupi untuk mengaktifkan pesanan`,
				});
			}

			await prisma.product.update({
				where: { id: item.productId },
				data: {
					stock: {
						decrement: item.quantity,
					},
				},
			});
		}
	}

	// Update order status
	const order = await prisma.order.update({
		where: { id },
		data: { status },
		include: {
			items: {
				include: {
					product: {
						select: {
							id: true,
							name: true,
							imageUrl: true,
						},
					},
				},
			},
		},
	});

	return {
		success: true,
		message: "Berhasil memperbarui status pesanan",
		data: order,
	};
};

// Delete order (Admin only)
export const deleteOrderService = async (id: string) => {
	const order = await prisma.order.findUnique({
		where: { id },
	});

	if (!order) {
		throw new HTTPException(404, { message: "Pesanan tidak ditemukan" });
	}

	// Restore stock before deleting (if not cancelled)
	if (order.status !== "CANCELLED") {
		const orderItems = await prisma.orderItem.findMany({
			where: { orderId: id },
		});

		for (const item of orderItems) {
			await prisma.product.update({
				where: { id: item.productId },
				data: {
					stock: {
						increment: item.quantity,
					},
				},
			});
		}
	}

	// Delete order (cascade will delete order items)
	await prisma.order.delete({
		where: { id },
	});

	return {
		success: true,
		message: "Berhasil menghapus pesanan",
	};
};
