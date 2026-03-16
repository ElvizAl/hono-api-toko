import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
	createReviewSchema,
	reviewQuerySchema,
	updateReviewSchema,
} from "./product-review.schema";
import {
	createReviewService,
	deleteReviewService,
	getAllReviewsService,
	getProductReviewsService,
	getReviewByIdService,
	updateReviewService,
} from "./product-review.service";

export const productReviewRouter = new Hono()

	// 1. Get All Reviews (Admin Only) - dengan pagination dan filtering
	.get(
		"/",
		requireAuth,
		requireRole(["ADMIN"]),
		zValidator("query", reviewQuerySchema),
		async (c) => {
			const query = c.req.valid("query");
			const result = await getAllReviewsService(query);
			return c.json(result, 200);
		},
	)

	// 2. Get Review By ID (Public)
	.get("/:id", async (c) => {
		const id = c.req.param("id");
		const result = await getReviewByIdService(id);
		return c.json(result, 200);
	})

	// 3. Get Reviews By Product (Public) - dengan pagination dan filtering
	.get(
		"/product/:productId",
		zValidator("query", reviewQuerySchema),
		async (c) => {
			const productId = c.req.param("productId");
			const query = c.req.valid("query");
			const result = await getProductReviewsService(productId, query);
			return c.json(result, 200);
		},
	)

	// 4. Create Review (Auth Required) - user bisa review product
	.post(
		"/product/:productId",
		requireAuth,
		zValidator("json", createReviewSchema),
		async (c) => {
			const user = c.get("user");
			const productId = c.req.param("productId");
			const body = c.req.valid("json");
			const result = await createReviewService(user.sub, productId, body);
			return c.json(result, 201);
		},
	)

	// 5. Update Review (Auth Required) - hanya own review atau admin
	.put(
		"/:id",
		requireAuth,
		zValidator("json", updateReviewSchema),
		async (c) => {
			const user = c.get("user");
			const id = c.req.param("id");
			const body = c.req.valid("json");
			const result = await updateReviewService(id, user.sub, user.role, body);
			return c.json(result, 200);
		},
	)

	// 6. Delete Review (Auth Required) - hanya own review atau admin
	.delete("/:id", requireAuth, async (c) => {
		const user = c.get("user");
		const id = c.req.param("id");
		const result = await deleteReviewService(id, user.sub, user.role);
		return c.json(result, 200);
	});
