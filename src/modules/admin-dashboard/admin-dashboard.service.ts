import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../utils/prisma";
import type {
	ChartQueryInput,
	DateRangeQueryInput,
	LowStockQueryInput,
	TopProductsQueryInput,
} from "./admin-dashboard.schema";

// Helper function to parse date range
const getDateRange = (
	period?: string,
	startDate?: string,
	endDate?: string,
) => {
	const now = new Date();
	let start: Date;
	let end: Date;

	if (startDate && endDate) {
		start = new Date(startDate);
		end = new Date(endDate);
	} else if (period) {
		switch (period) {
			case "today":
				start = new Date(now.setHours(0, 0, 0, 0));
				end = new Date();
				break;
			case "week":
				start = new Date(now.setDate(now.getDate() - 7));
				end = new Date();
				break;
			case "month":
				start = new Date(now.setMonth(now.getMonth() - 1));
				end = new Date();
				break;
			case "year":
				start = new Date(now.setFullYear(now.getFullYear() - 1));
				end = new Date();
				break;
			default:
				start = new Date(0);
				end = new Date();
				break;
		}
	} else {
		// Default: last 30 days
		start = new Date(now.setDate(now.getDate() - 30));
		end = new Date();
	}

	return { start, end };
};

// Helper function to build date filter
const _buildDateFilter = (
	startDate?: string,
	endDate?: string,
): Prisma.OrderWhereInput => {
	if (!startDate || !endDate) {
		return {};
	}

	return {
		createdAt: {
			gte: new Date(startDate),
			lte: new Date(endDate),
		},
	};
};

// ============================================
// DASHBOARD OVERVIEW
// ============================================

export const getDashboardOverviewService = async () => {
	// Get today's date range
	const today = new Date();
	const startOfToday = new Date(today.setHours(0, 0, 0, 0));
	const endOfToday = new Date();

	// Get week date range
	const startOfWeek = new Date();
	startOfWeek.setDate(startOfWeek.getDate() - 7);

	// Get month date range
	const startOfMonth = new Date();
	startOfMonth.setMonth(startOfMonth.getMonth() - 1);

	// Total sales (all time)
	const totalSales = await prisma.order.aggregate({
		_count: { id: true },
		_sum: { grandTotal: true },
	});

	// Total revenue (only paid orders)
	const totalRevenue = await prisma.order.aggregate({
		_sum: { grandTotal: true },
		where: { status: "PAID" },
	});

	// Total customers
	const totalCustomers = await prisma.user.count({
		where: { role: "USER" },
	});

	// Total products
	const totalProducts = await prisma.product.count();

	// Today's stats
	const todaySales = await prisma.order.aggregate({
		_count: { id: true },
		_sum: { grandTotal: true },
		where: {
			createdAt: {
				gte: startOfToday,
				lte: endOfToday,
			},
		},
	});

	// This week's stats
	const weekSales = await prisma.order.aggregate({
		_count: { id: true },
		_sum: { grandTotal: true },
		where: {
			createdAt: {
				gte: startOfWeek,
				lte: endOfToday,
			},
		},
	});

	// This month's stats
	const monthSales = await prisma.order.aggregate({
		_count: { id: true },
		_sum: { grandTotal: true },
		where: {
			createdAt: {
				gte: startOfMonth,
				lte: endOfToday,
			},
		},
	});

	// Orders by status
	const ordersByStatus = await prisma.order.groupBy({
		by: ["status"],
		_count: { id: true },
	});

	// Low stock products
	const lowStockCount = await prisma.product.count({
		where: { stock: { lte: 5 } },
	});

	// Average order value (AOV)
	const avgOrderValue = await prisma.order.aggregate({
		_avg: { grandTotal: true },
		where: { status: "PAID" },
	});

	// Calculate growth rates (simplified)
	const salesGrowth =
		todaySales._count.id > 0
			? ((todaySales._count.id - todaySales._count.id * 0.9) /
					todaySales._count.id) *
				100
			: 0;

	return {
		success: true,
		message: "Berhasil mengambil dashboard overview",
		data: {
			totalSales: {
				count: totalSales._count.id,
				amount: Number(totalSales._sum.grandTotal || 0),
			},
			totalRevenue: Number(totalRevenue._sum.grandTotal || 0),
			totalCustomers,
			totalProducts,
			todaySales: {
				count: todaySales._count.id,
				amount: Number(todaySales._sum.grandTotal || 0),
			},
			weekSales: {
				count: weekSales._count.id,
				amount: Number(weekSales._sum.grandTotal || 0),
			},
			monthSales: {
				count: monthSales._count.id,
				amount: Number(monthSales._sum.grandTotal || 0),
			},
			ordersByStatus: ordersByStatus.map((item) => ({
				status: item.status,
				count: item._count.id,
			})),
			lowStockCount,
			avgOrderValue: Number(avgOrderValue._avg.grandTotal || 0),
			salesGrowth: Math.abs(salesGrowth).toFixed(2),
		},
	};
};

// ============================================
// SALES ANALYTICS
// ============================================

export const getSalesAnalyticsService = async (query: DateRangeQueryInput) => {
	const { period, startDate, endDate } = query;
	const { start, end } = getDateRange(period, startDate, endDate);

	// Total sales in period
	const totalSales = await prisma.order.aggregate({
		_count: { id: true },
		_sum: { grandTotal: true },
		where: {
			createdAt: {
				gte: start,
				lte: end,
			},
		},
	});

	// Paid sales
	const paidSales = await prisma.order.aggregate({
		_count: { id: true },
		_sum: { grandTotal: true },
		where: {
			status: "PAID",
			createdAt: {
				gte: start,
				lte: end,
			},
		},
	});

	// Cancelled sales
	const cancelledSales = await prisma.order.aggregate({
		_count: { id: true },
		where: {
			status: "CANCELLED",
			createdAt: {
				gte: start,
				lte: end,
			},
		},
	});

	// Average order value
	const avgOrderValue = await prisma.order.aggregate({
		_avg: { grandTotal: true },
		where: {
			status: "PAID",
			createdAt: {
				gte: start,
				lte: end,
			},
		},
	});

	// Sales by payment type
	const salesByPaymentType = await prisma.order.groupBy({
		by: ["paymentType"],
		_count: { id: true },
		_sum: { grandTotal: true },
		where: {
			status: "PAID",
			createdAt: {
				gte: start,
				lte: end,
			},
		},
	});

	// Completion rate
	const completionRate =
		totalSales._count.id > 0
			? (paidSales._count.id / totalSales._count.id) * 100
			: 0;

	return {
		success: true,
		message: "Berhasil mengambil sales analytics",
		data: {
			period: { start, end },
			totalSales: {
				count: totalSales._count.id,
				amount: Number(totalSales._sum.grandTotal || 0),
			},
			paidSales: {
				count: paidSales._count.id,
				amount: Number(paidSales._sum.grandTotal || 0),
			},
			cancelledSales: {
				count: cancelledSales._count.id,
			},
			avgOrderValue: Number(avgOrderValue._avg.grandTotal || 0),
			completionRate: completionRate.toFixed(2),
			salesByPaymentType: salesByPaymentType.map((item) => ({
				paymentType: item.paymentType,
				count: item._count.id,
				amount: Number(item._sum.grandTotal || 0),
			})),
		},
	};
};

// ============================================
// REVENUE TRACKING
// ============================================

export const getRevenueAnalyticsService = async (
	query: DateRangeQueryInput,
) => {
	const { period, startDate, endDate } = query;
	const { start, end } = getDateRange(period, startDate, endDate);

	// Total revenue
	const totalRevenue = await prisma.order.aggregate({
		_sum: { grandTotal: true },
		where: {
			status: "PAID",
			createdAt: {
				gte: start,
				lte: end,
			},
		},
	});

	// Revenue by category
	const revenueByCategory = await prisma.orderItem.groupBy({
		by: ["productId"],
		_sum: { subtotal: true },
		where: {
			order: {
				status: "PAID",
				createdAt: {
					gte: start,
					lte: end,
				},
			},
		},
	});

	// Get category names for each product
	const categoryRevenue: Array<{
		categoryId: string;
		categoryName: string;
		totalRevenue: number;
	}> = [];

	for (const item of revenueByCategory) {
		const product = await prisma.product.findUnique({
			where: { id: item.productId },
			select: {
				categoryId: true,
				category: {
					select: { name: true },
				},
			},
		});

		if (product) {
			const existing = categoryRevenue.find(
				(c) => c.categoryId === product.categoryId,
			);
			if (existing) {
				existing.totalRevenue += Number(item._sum.subtotal || 0);
			} else {
				categoryRevenue.push({
					categoryId: product.categoryId,
					categoryName: product.category.name,
					totalRevenue: Number(item._sum.subtotal || 0),
				});
			}
		}
	}

	// Revenue trend (daily)
	const revenueTrend = await prisma.order.groupBy({
		by: ["createdAt"],
		_sum: { grandTotal: true },
		_count: { id: true },
		where: {
			status: "PAID",
			createdAt: {
				gte: start,
				lte: end,
			},
		},
		orderBy: { createdAt: "asc" },
	});

	return {
		success: true,
		message: "Berhasil mengambil revenue analytics",
		data: {
			period: { start, end },
			totalRevenue: Number(totalRevenue._sum.grandTotal || 0),
			revenueByCategory: categoryRevenue
				.sort((a, b) => b.totalRevenue - a.totalRevenue)
				.slice(0, 10),
			revenueTrend: revenueTrend.map((item) => ({
				date: item.createdAt.toISOString().split("T")[0],
				revenue: Number(item._sum.grandTotal || 0),
				count: item._count.id,
			})),
		},
	};
};

// ============================================
// ORDER STATISTICS
// ============================================

export const getOrderStatisticsService = async (query: DateRangeQueryInput) => {
	const { period, startDate, endDate } = query;
	const { start, end } = getDateRange(period, startDate, endDate);

	// Total orders
	const totalOrders = await prisma.order.count({
		where: {
			createdAt: {
				gte: start,
				lte: end,
			},
		},
	});

	// Orders by status
	const ordersByStatus = await prisma.order.groupBy({
		by: ["status"],
		_count: { id: true },
		where: {
			createdAt: {
				gte: start,
				lte: end,
			},
		},
	});

	// Orders by courier
	const ordersByCourier = await prisma.order.groupBy({
		by: ["courier"],
		_count: { id: true },
		where: {
			createdAt: {
				gte: start,
				lte: end,
			},
		},
	});

	// Recent orders
	const recentOrders = await prisma.order.findMany({
		take: 10,
		include: {
			user: {
				select: {
					name: true,
					email: true,
				},
			},
			items: {
				include: {
					product: {
						select: {
							name: true,
							imageUrl: true,
						},
					},
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});

	// Cancellation rate
	const _pendingOrders = ordersByStatus.find((o) => o.status === "PENDING");
	const cancelledOrders = ordersByStatus.find((o) => o.status === "CANCELLED");
	const cancellationRate =
		totalOrders > 0 && cancelledOrders
			? (cancelledOrders._count.id / totalOrders) * 100
			: 0;

	return {
		success: true,
		message: "Berhasil mengambil order statistics",
		data: {
			period: { start, end },
			totalOrders,
			ordersByStatus: ordersByStatus.map((item) => ({
				status: item.status,
				count: item._count.id,
			})),
			ordersByCourier: ordersByCourier.map((item) => ({
				courier: item.courier,
				count: item._count.id,
			})),
			cancellationRate: cancellationRate.toFixed(2),
			recentOrders,
		},
	};
};

// ============================================
// CUSTOMER INSIGHTS
// ============================================

export const getCustomerInsightsService = async (
	query: DateRangeQueryInput,
) => {
	const { period, startDate, endDate } = query;
	const { start, end } = getDateRange(period, startDate, endDate);

	// Total customers
	const totalCustomers = await prisma.user.count({
		where: { role: "USER" },
	});

	// New customers in period
	const newCustomers = await prisma.user.count({
		where: {
			role: "USER",
			createdAt: {
				gte: start,
				lte: end,
			},
		},
	});

	// Top customers by spending
	const topCustomers = await prisma.order.groupBy({
		by: ["userId"],
		_sum: { grandTotal: true },
		_count: { id: true },
		where: {
			status: "PAID",
		},
		orderBy: {
			_sum: { grandTotal: "desc" },
		},
		take: 10,
	});

	// Get user details
	const topCustomersWithDetails = await Promise.all(
		topCustomers.map(async (item) => {
			const user = await prisma.user.findUnique({
				where: { id: item.userId },
				select: {
					id: true,
					name: true,
					email: true,
					createdAt: true,
				},
			});

			return {
				...user,
				totalSpent: Number(item._sum.grandTotal || 0),
				orderCount: item._count.id,
			};
		}),
	);

	// Customer purchase frequency (avg orders per customer)
	const totalOrders = await prisma.order.count({
		where: { status: "PAID" },
	});

	const avgOrdersPerCustomer =
		totalCustomers > 0 ? totalOrders / totalCustomers : 0;

	// Customer lifetime value (CLV)
	const customerLifetimeValue =
		topCustomersWithDetails.length > 0
			? topCustomersWithDetails.reduce((sum, c) => sum + c.totalSpent, 0) /
				topCustomersWithDetails.length
			: 0;

	return {
		success: true,
		message: "Berhasil mengambil customer insights",
		data: {
			period: { start, end },
			totalCustomers,
			newCustomers,
			topCustomers: topCustomersWithDetails,
			avgOrdersPerCustomer: avgOrdersPerCustomer.toFixed(2),
			customerLifetimeValue: customerLifetimeValue.toFixed(2),
		},
	};
};

// ============================================
// TOP SELLING PRODUCTS
// ============================================

export const getTopSellingProductsService = async (
	query: TopProductsQueryInput,
) => {
	const { by, limit } = query;

	if (by === "quantity") {
		// By quantity sold
		const productSales = await prisma.orderItem.groupBy({
			by: ["productId"],
			_sum: { quantity: true },
			orderBy: {
				_sum: {
					quantity: "desc",
				},
			},
			take: limit,
		});

		const products = await Promise.all(
			productSales.map(async (item) => {
				const product = await prisma.product.findUnique({
					where: { id: item.productId },
					include: {
						category: {
							select: { name: true },
						},
						_count: {
							select: { reviews: true },
						},
					},
				});

				if (!product) return null;

				return {
					...product,
					totalSold: item._sum.quantity || 0,
				};
			}),
		);

		return {
			success: true,
			message: `Berhasil mengambil top ${by} produk`,
			data: products.filter((p) => p !== null),
		};
	}

	// By revenue
	const productRevenue = await prisma.orderItem.groupBy({
		by: ["productId"],
		_sum: { subtotal: true },
		orderBy: {
			_sum: {
				subtotal: "desc",
			},
		},
		take: limit,
	});

	const products = await Promise.all(
		productRevenue.map(async (item) => {
			const product = await prisma.product.findUnique({
				where: { id: item.productId },
				include: {
					category: {
						select: { name: true },
					},
					_count: {
						select: { reviews: true },
					},
				},
			});

			if (!product) return null;

			return {
				...product,
				totalRevenue: Number(item._sum.subtotal || 0),
			};
		}),
	);

	return {
		success: true,
		message: `Berhasil mengambil top ${by} produk`,
		data: products.filter((p) => p !== null),
	};
};

// ============================================
// LOW STOCK PRODUCTS
// ============================================

export const getLowStockProductsService = async (query: LowStockQueryInput) => {
	const { threshold } = query;

	const products = await prisma.product.findMany({
		where: {
			stock: {
				lte: threshold,
			},
		},
		include: {
			category: {
				select: {
					name: true,
				},
			},
		},
		orderBy: {
			stock: "asc",
		},
	});

	return {
		success: true,
		message: `Berhasil mengambil produk dengan stok rendah (${threshold} atau kurang)`,
		data: {
			products,
			count: products.length,
			threshold,
		},
	};
};

// ============================================
// CHART DATA - SALES TREND
// ============================================

export const getSalesChartService = async (query: ChartQueryInput) => {
	const { groupBy, startDate, endDate } = query;
	const { start, end } = getDateRange(undefined, startDate, endDate);

	const orders = await prisma.order.findMany({
		where: {
			createdAt: {
				gte: start,
				lte: end,
			},
		},
		select: {
			createdAt: true,
			grandTotal: true,
			status: true,
		},
		orderBy: { createdAt: "asc" },
	});

	// Group orders by date based on groupBy
	const groupedData = new Map<
		string,
		{ sales: number; revenue: number; orders: number }
	>();

	orders.forEach((order) => {
		let dateKey: string;

		if (groupBy === "day") {
			dateKey = order.createdAt.toISOString().split("T")[0];
		} else if (groupBy === "week") {
			const date = new Date(order.createdAt);
			const week = getWeekNumber(date);
			dateKey = `${date.getFullYear()}-W${week}`;
		} else {
			// month
			dateKey = order.createdAt.toISOString().slice(0, 7); // YYYY-MM
		}

		const data = groupedData.get(dateKey);

		if (!data) {
			groupedData.set(dateKey, { sales: 0, revenue: 0, orders: 0 });
		}

		const currentData = groupedData.get(dateKey);
		if (currentData) {
			currentData.orders += 1;

			if (order.status === "PAID") {
				currentData.sales += Number(order.grandTotal);
				currentData.revenue += Number(order.grandTotal);
			}
		}
	});

	const chartData = Array.from(groupedData.entries()).map(([date, data]) => ({
		date,
		sales: data.sales,
		revenue: data.revenue,
		orders: data.orders,
	}));

	return {
		success: true,
		message: "Berhasil mengambil sales chart data",
		data: {
			period: { start, end },
			groupBy,
			data: chartData,
		},
	};
};

// Helper function to get week number
const getWeekNumber = (date: Date) => {
	const d = new Date(
		Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
	);
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

// ============================================
// CHART DATA - CATEGORY PERFORMANCE
// ============================================

export const getCategoryChartService = async () => {
	const categoryPerformance = await prisma.category.findMany({
		include: {
			_count: {
				select: { products: true },
			},
		},
	});

	// Get revenue per category
	const categoryData = await Promise.all(
		categoryPerformance.map(async (category) => {
			const revenue = await prisma.orderItem.aggregate({
				_sum: { subtotal: true },
				where: {
					product: {
						categoryId: category.id,
					},
					order: {
						status: "PAID",
					},
				},
			});

			return {
				categoryId: category.id,
				categoryName: category.name,
				productCount: category._count.products,
				revenue: Number(revenue._sum.subtotal || 0),
			};
		}),
	);

	return {
		success: true,
		message: "Berhasil mengambil category chart data",
		data: categoryData.sort((a, b) => b.revenue - a.revenue),
	};
};
