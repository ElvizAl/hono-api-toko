import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { requireAuth, requireRole } from "../../middleware/auth";
import { categorySchema } from "./category.schema";
import {
	createCategoryService,
	deleteCategoryService,
	getAllCategoriesService,
	updateCategoryService,
} from "./category.service";

export const categoryRouter = new Hono()

	// 1. Get All Categories (Bisa diakses publik/siapa saja)
	.get("/", async (c) => {
		const result = await getAllCategoriesService();
		return c.json(result, 200);
	})

	// 2. Create Category (Hanya Admin)
	.post(
		"/",
		requireAuth,
		requireRole(["ADMIN"]),
		zValidator("json", categorySchema),
		async (c) => {
			const body = c.req.valid("json");
			const result = await createCategoryService(body);
			return c.json(result, 201);
		},
	)

	// 3. Update Category (Hanya Admin)
	.put(
		"/:id",
		requireAuth,
		requireRole(["ADMIN"]),
		zValidator("json", categorySchema),
		async (c) => {
			const id = c.req.param("id");
			const body = c.req.valid("json");
			const result = await updateCategoryService(id, body);
			return c.json(result, 200);
		},
	)

	// 4. Delete Category (Hanya Admin)
	.delete("/:id", requireAuth, requireRole(["ADMIN"]), async (c) => {
		const id = c.req.param("id");
		const result = await deleteCategoryService(id);
		return c.json(result, 200);
	});
