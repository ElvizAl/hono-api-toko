import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { authRouter } from "./modules/auth/auth.route";
import "dotenv";

const app = new Hono().basePath("api").route("/auth", authRouter);

app.use(logger());

app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.notFound((c) => {
  return c.json({ message: "Tidak Ditemukan" }, 404);
});

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status);
  }

  console.error("Internal Server Error:", err);
  return c.json({ message: "Internal Server Error" }, 500);
});

export default app;
