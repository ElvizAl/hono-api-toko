import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
	calculateCostSchema,
	getCityParamSchema,
	getDistrictParamSchema,
	getSubdistrictParamSchema,
	searchDestinationSchema,
	trackWaybillSchema,
} from "./rajaongkir.schema";
import {
	calculateShippingCostService,
	getCitiesService,
	getDistrictsService,
	getProvincesService,
	getSubdistrictsService,
	searchDomesticDestinationService,
	searchInternationalDestinationService,
	trackWaybillService,
} from "./rajaongkir.service";

export const rajaOngkirRouter = new Hono()
	.get("/province", async (c) => {
		const result = await getProvincesService();
		return c.json(result, 200);
	})

	.get(
		"/city/:provinceId",
		zValidator("param", getCityParamSchema),
		async (c) => {
			const { provinceId } = c.req.valid("param");
			const result = await getCitiesService(provinceId);
			return c.json(result, 200);
		},
	)

	.get(
		"/district/:cityId",
		zValidator("param", getDistrictParamSchema),
		async (c) => {
			const { cityId } = c.req.valid("param");
			const result = await getDistrictsService(cityId);
			return c.json(result, 200);
		},
	)

	.get(
		"/sub-district/:districtId",
		zValidator("param", getSubdistrictParamSchema),
		async (c) => {
			const { districtId } = c.req.valid("param");
			const result = await getSubdistrictsService(districtId);
			return c.json(result, 200);
		},
	)

	.post("/cost", zValidator("json", calculateCostSchema), async (c) => {
		const body = c.req.valid("json");
		const result = await calculateShippingCostService(body);
		return c.json(result, 200);
	})

	// === DIRECT SEARCH ===
	.get(
		"/domestic-destination",
		zValidator("query", searchDestinationSchema),
		async (c) => {
			const { search, limit, offset } = c.req.valid("query");
			const result = await searchDomesticDestinationService(
				search,
				limit,
				offset,
			);
			return c.json(result, 200);
		},
	)

	.get(
		"/international-destination",
		zValidator("query", searchDestinationSchema),
		async (c) => {
			const { search, limit, offset } = c.req.valid("query");
			const result = await searchInternationalDestinationService(
				search,
				limit,
				offset,
			);
			return c.json(result, 200);
		},
	)

	// === TRACKING ===
	.post("/track", zValidator("query", trackWaybillSchema), async (c) => {
		const { awb, courier } = c.req.valid("query");
		const result = await trackWaybillService(awb, courier);
		return c.json(result, 200);
	});
