import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { requireAuth, requireRole } from "../../middleware/auth";
import { upsertProfileSchema } from "./profile.schema";
import {
	deleteProfileService,
	getAllProfilesService,
	getMyProfileService,
	getProfileByIdService,
	updateProfileService,
	upsertProfileService,
} from "./profile.service";

export const profileRouter = new Hono()
	// Middleware harus login untuk semua route profile
	.use("*", requireAuth)

	// Get Profile User yang sedang login
	.get("/", async (c) => {
		const user = c.get("user");
		const result = await getMyProfileService(user.sub);
		return c.json(result, 200);
	})

	// Upsert (Create/Update) Profile
	.put("/", zValidator("json", upsertProfileSchema), async (c) => {
		const user = c.get("user");
		const body = c.req.valid("json");
		const result = await upsertProfileService(user.sub, body);
		return c.json(result, 200);
	})

	// ========================
	// ADMIN ROUTES
	// ========================

	// Get All Profiles
	.get("/admin", requireRole(["ADMIN"]), async (c) => {
		const result = await getAllProfilesService();
		return c.json(result, 200);
	})

	// Get Profile By ID
	.get("/admin/:id", requireRole(["ADMIN"]), async (c) => {
		const id = c.req.param("id");
		const result = await getProfileByIdService(id);
		return c.json(result, 200);
	})

	// Update Any Profile
	.put(
		"/admin/:id",
		requireRole(["ADMIN"]),
		zValidator("json", upsertProfileSchema),
		async (c) => {
			const id = c.req.param("id");
			const body = c.req.valid("json");
			const result = await updateProfileService(id, body);
			return c.json(result, 200);
		},
	)

	// Delete Any Profile
	.delete("/admin/:id", requireRole(["ADMIN"]), async (c) => {
		const id = c.req.param("id");
		const result = await deleteProfileService(id);
		return c.json(result, 200);
	});
