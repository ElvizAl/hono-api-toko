import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { authRouter } from "./modules/auth/auth.route";
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

	.route("/auth", authRouter)
	.route("/profile", profileRouter)
	.route("/users", userRouter)
	.route("/rajaongkir", rajaOngkirRouter)

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
