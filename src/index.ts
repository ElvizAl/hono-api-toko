import { apiReference } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";

import { adminDashboardRouter } from "./modules/admin-dashboard/admin-dashboard.route";
import { authRouter } from "./modules/auth/auth.route";
import { categoryRouter } from "./modules/category/category.route";
import { orderRouter } from "./modules/order/order.route";
import { productRouter } from "./modules/product/product.route";
import { productReviewRouter } from "./modules/product-review/product-review.route";
import { profileRouter } from "./modules/profile/profile.route";
import { rajaOngkirRouter } from "./modules/rajaongkir/rajaongkir.route";
import { userRouter } from "./modules/user/user.route";
import "dotenv";

const app = new Hono()
	.basePath("api")

	.use(logger())

	.use(
		"*",
		cors({
			origin: ["http://localhost:3000"],
			allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
			allowHeaders: ["Content-Type", "Authorization"],
			credentials: true,
		}),
	)

	// Routing setup
	.route("/auth", authRouter)
	.route("/admin-dashboard", adminDashboardRouter)
	.route("/categories", categoryRouter)
	.route("/orders", orderRouter)
	.route("/products", productRouter)
	.route("/product-reviews", productReviewRouter)
	.route("/profile", profileRouter)
	.route("/users", userRouter)
	.route("/rajaongkir", rajaOngkirRouter)

	// Serve the OpenAPI JSON spec
	.get("/openapi.json", async (c) => {
		const fs = await import("node:fs");
		const path = await import("node:path");
		const file = fs.readFileSync(
			path.join(process.cwd(), "src", "openapi.json"),
			"utf-8",
		);
		return c.json(JSON.parse(file));
	})

	// Scalar API Docs UI
	.get(
		"/docs",
		apiReference({
			theme: "saturn",
			url: "/api/openapi.json",
		}),
	)

	.notFound((c) => {
		return c.json({ message: "Tidak Ditemukan" }, 404);
	})

	.onError((err, c) => {
		if (err instanceof HTTPException) {
			return c.json({ message: err.message }, err.status);
		}

		console.error("Internal Server Error:", err);
		return c.json({ message: "Internal Server Error" }, 500);
	});

export default app;
