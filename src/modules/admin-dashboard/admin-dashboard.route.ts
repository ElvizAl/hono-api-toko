import type { Context, MiddlewareHandler } from "hono";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import {
	getCategoryChartService,
	getCustomerInsightsService,
	getDashboardOverviewService,
	getLowStockProductsService,
	getOrderStatisticsService,
	getRevenueAnalyticsService,
	getSalesAnalyticsService,
	getSalesChartService,
	getTopSellingProductsService,
} from "./admin-dashboard.service";

// Validation schemas for query params
const DateRangeQuerySchema = z.object({
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	period: z.enum(["today", "week", "month", "year", "all"]).optional(),
});

const TopProductsQuerySchema = z.object({
	by: z.enum(["quantity", "revenue"]).default("revenue"),
	limit: z.coerce.number().int().positive().max(50).default(10),
});

const LowStockQuerySchema = z.object({
	threshold: z.coerce.number().int().positive().default(5),
});

const ChartQuerySchema = z.object({
	groupBy: z.enum(["day", "week", "month"]).default("day"),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
});

// Middleware to check if user is admin
const adminOnly: MiddlewareHandler = async (c: Context, next) => {
	const user = c.get("user");

	if (!user || user.role !== "ADMIN") {
		throw new HTTPException(403, {
			message: "Akses ditolak. Hanya admin yang dapat mengakses.",
		});
	}

	await next();
};

const adminDashboardRouter = new Hono()
	// Apply admin-only middleware to all routes
	.use("/*", adminOnly)

	// ============================================
	// DASHBOARD OVERVIEW
	// ============================================
	.get("/overview", async (c) => {
		try {
			const result = await getDashboardOverviewService();
			return c.json(result);
		} catch (error) {
			console.error("Error in /overview:", error);
			if (error instanceof HTTPException) {
				throw error;
			}
			throw new HTTPException(500, { message: "Internal server error" });
		}
	})

	// ============================================
	// SALES ANALYTICS
	// ============================================
	.get("/stats/sales", async (c) => {
		try {
			const query = DateRangeQuerySchema.parse(c.req.query());
			const result = await getSalesAnalyticsService(query);
			return c.json(result);
		} catch (error) {
			console.error("Error in /stats/sales:", error);
			if (error instanceof HTTPException) {
				throw error;
			}
			throw new HTTPException(500, { message: "Internal server error" });
		}
	})

	// ============================================
	// REVENUE ANALYTICS
	// ============================================
	.get("/stats/revenue", async (c) => {
		try {
			const query = DateRangeQuerySchema.parse(c.req.query());
			const result = await getRevenueAnalyticsService(query);
			return c.json(result);
		} catch (error) {
			console.error("Error in /stats/revenue:", error);
			if (error instanceof HTTPException) {
				throw error;
			}
			throw new HTTPException(500, { message: "Internal server error" });
		}
	})

	// ============================================
	// ORDER STATISTICS
	// ============================================
	.get("/stats/orders", async (c) => {
		try {
			const query = DateRangeQuerySchema.parse(c.req.query());
			const result = await getOrderStatisticsService(query);
			return c.json(result);
		} catch (error) {
			console.error("Error in /stats/orders:", error);
			if (error instanceof HTTPException) {
				throw error;
			}
			throw new HTTPException(500, { message: "Internal server error" });
		}
	})

	// ============================================
	// CUSTOMER INSIGHTS
	// ============================================
	.get("/stats/customers", async (c) => {
		try {
			const query = DateRangeQuerySchema.parse(c.req.query());
			const result = await getCustomerInsightsService(query);
			return c.json(result);
		} catch (error) {
			console.error("Error in /stats/customers:", error);
			if (error instanceof HTTPException) {
				throw error;
			}
			throw new HTTPException(500, { message: "Internal server error" });
		}
	})

	// ============================================
	// TOP SELLING PRODUCTS
	// ============================================
	.get("/products/top-selling", async (c) => {
		try {
			const query = TopProductsQuerySchema.parse(c.req.query());
			const result = await getTopSellingProductsService(query);
			return c.json(result);
		} catch (error) {
			console.error("Error in /products/top-selling:", error);
			if (error instanceof HTTPException) {
				throw error;
			}
			throw new HTTPException(500, { message: "Internal server error" });
		}
	})

	// ============================================
	// LOW STOCK PRODUCTS
	// ============================================
	.get("/products/low-stock", async (c) => {
		try {
			const query = LowStockQuerySchema.parse(c.req.query());
			const result = await getLowStockProductsService(query);
			return c.json(result);
		} catch (error) {
			console.error("Error in /products/low-stock:", error);
			if (error instanceof HTTPException) {
				throw error;
			}
			throw new HTTPException(500, { message: "Internal server error" });
		}
	})

	// ============================================
	// CHART DATA - SALES TREND
	// ============================================
	.get("/charts/sales", async (c) => {
		try {
			const query = ChartQuerySchema.parse(c.req.query());
			const result = await getSalesChartService(query);
			return c.json(result);
		} catch (error) {
			console.error("Error in /charts/sales:", error);
			if (error instanceof HTTPException) {
				throw error;
			}
			throw new HTTPException(500, { message: "Internal server error" });
		}
	})

	// ============================================
	// CHART DATA - CATEGORY PERFORMANCE
	// ============================================
	.get("/charts/categories", async (c) => {
		try {
			const result = await getCategoryChartService();
			return c.json(result);
		} catch (error) {
			console.error("Error in /charts/categories:", error);
			if (error instanceof HTTPException) {
				throw error;
			}
			throw new HTTPException(500, { message: "Internal server error" });
		}
	});

export { adminDashboardRouter };
