import { z } from "zod";

// Query parameters for date range filtering
export const DateRangeQuerySchema = z.object({
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	period: z.enum(["today", "week", "month", "year", "all"]).optional(),
});

// Query parameters for pagination
export const PaginationQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(10),
});

// Query parameters for top products
export const TopProductsQuerySchema = z.object({
	by: z.enum(["quantity", "revenue"]).default("revenue"),
	limit: z.coerce.number().int().positive().max(50).default(10),
});

// Query parameters for low stock
export const LowStockQuerySchema = z.object({
	threshold: z.coerce.number().int().positive().default(5),
});

// Query parameters for charts
export const ChartQuerySchema = z.object({
	groupBy: z.enum(["day", "week", "month"]).default("day"),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
});

export type DateRangeQueryInput = z.infer<typeof DateRangeQuerySchema>;
export type PaginationQueryInput = z.infer<typeof PaginationQuerySchema>;
export type TopProductsQueryInput = z.infer<typeof TopProductsQuerySchema>;
export type LowStockQueryInput = z.infer<typeof LowStockQuerySchema>;
export type ChartQueryInput = z.infer<typeof ChartQuerySchema>;
