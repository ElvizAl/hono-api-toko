import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { requireAuth, requireRole } from "../../middleware/auth";
import { createOrderSchema, updateOrderStatusSchema } from "./order.schema";
import {
	createOrderService,
	deleteOrderService,
	getAllOrdersService,
	getOrderByIdService,
	getUserOrdersService,
	updateOrderStatusService,
} from "./order.service";

export const orderRouter = new Hono()
	// Middleware harus login untuk semua route order
	.use("*", requireAuth)

	// ========================
	// ADMIN ROUTES (harus di atas user routes)
	// ========================

	// Get All Orders
	.get("/admin", requireRole(["ADMIN"]), async (c) => {
		const result = await getAllOrdersService();
		return c.json(result, 200);
	})

	// Get Order By ID (Admin)
	.get("/admin/:id", requireRole(["ADMIN"]), async (c) => {
		const id = c.req.param("id");
		const result = await getOrderByIdService(id);
		return c.json(result, 200);
	})

	// Update Order Status
	.put(
		"/admin/:id/status",
		requireRole(["ADMIN"]),
		zValidator("json", updateOrderStatusSchema),
		async (c) => {
			const id = c.req.param("id");
			const body = c.req.valid("json");
			const result = await updateOrderStatusService(id, body);
			return c.json(result, 200);
		},
	)

	// Delete Order
	.delete("/admin/:id", requireRole(["ADMIN"]), async (c) => {
		const id = c.req.param("id");
		const result = await deleteOrderService(id);
		return c.json(result, 200);
	})

	// ========================
	// USER ROUTES
	// ========================

	// Get Orders User yang sedang login
	.get("/", async (c) => {
		const user = c.get("user");
		const result = await getUserOrdersService(user.sub);
		return c.json(result, 200);
	})

	// Get Order By ID
	.get("/:id", async (c) => {
		const id = c.req.param("id");
		const userId = c.get("user").sub;
		const userRole = c.get("user").role;
		const result = await getOrderByIdService(id, userId, userRole);
		return c.json(result, 200);
	})

	// Create Order
	.post("/", zValidator("form", createOrderSchema), async (c) => {
		const userId = c.get("user").sub;
		const body = c.req.valid("form");

		// Parse items from JSON string
		const orderData = {
			...body,
			items:
				typeof body.items === "string" ? JSON.parse(body.items) : body.items,
		};

		const result = await createOrderService(userId, orderData);
		return c.json(result, 201);
	});
