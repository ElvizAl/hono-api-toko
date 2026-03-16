import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
	lowStockThresholdSchema,
	productQuerySchema,
	productSchema,
	updateStockSchema,
} from "./product.schema";
import {
	createProductService,
	deleteProductService,
	getAllProductsService,
	getLowStockProductsService,
	getProductByIdService,
	updateProductService,
	updateProductStockService,
} from "./product.service";

export const productRouter = new Hono()

	// 1. Get All Products (Public) - dengan pagination, filtering, search, sort
	.get("/", zValidator("query", productQuerySchema), async (c) => {
		const query = c.req.valid("query");
		const result = await getAllProductsService(query);
		return c.json(result, 200);
	})

	// 2. Get Low Stock Products (Admin Only)
	.get(
		"/low-stock",
		requireAuth,
		requireRole(["ADMIN"]),
		zValidator("query", lowStockThresholdSchema),
		async (c) => {
			const query = c.req.valid("query");
			const threshold = query.threshold;
			const result = await getLowStockProductsService(threshold);
			return c.json(result, 200);
		},
	)

	// 3. Get Product By ID (Public)
	.get("/:id", async (c) => {
		const id = c.req.param("id");
		const result = await getProductByIdService(id);
		return c.json(result, 200);
	})

	// 4. Create Product (Admin Only)
	.post(
		"/",
		requireAuth,
		requireRole(["ADMIN"]),
		zValidator("form", productSchema),
		async (c) => {
			const body = c.req.valid("form");
			const result = await createProductService(body);
			return c.json(result, 201);
		},
	)

	// 5. Update Product (Admin Only)
	.put(
		"/:id",
		requireAuth,
		requireRole(["ADMIN"]),
		zValidator("form", productSchema),
		async (c) => {
			const id = c.req.param("id");
			const body = c.req.valid("form");
			const result = await updateProductService(id, body);
			return c.json(result, 200);
		},
	)

	// 6. Delete Product (Admin Only)
	.delete("/:id", requireAuth, requireRole(["ADMIN"]), async (c) => {
		const id = c.req.param("id");
		const result = await deleteProductService(id);
		return c.json(result, 200);
	})

	// 7. Update Product Stock (Admin Only)
	.patch(
		"/:id/stock",
		requireAuth,
		requireRole(["ADMIN"]),
		zValidator("json", updateStockSchema),
		async (c) => {
			const id = c.req.param("id");
			const body = c.req.valid("json");
			const result = await updateProductStockService(id, body);
			return c.json(result, 200);
		},
	);
