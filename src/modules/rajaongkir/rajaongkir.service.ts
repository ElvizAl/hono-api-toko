import { HTTPException } from "hono/http-exception";
import { env } from "../../config/env";

const BASE_URL = env.RAJAONGKIR_BASE_URL;
const API_KEY = env.RAJAONGKIR_API_KEY;

const fetchRajaOngkir = async (endpoint: string, options: RequestInit = {}) => {
	try {
		const response = await fetch(`${BASE_URL}${endpoint}`, {
			...options,
			headers: {
				key: API_KEY,
				"Content-Type": "application/x-www-form-urlencoded",
				...options.headers,
			},
		});

		const data = await response.json();

		// RajaOngkir V2 response structure might be different, usually it has a Meta or Status
		if (data.meta && data.meta.code !== 200) {
			throw new Error(data.meta.message || "Unknown Error from RajaOngkir");
		}

		if (data.status && data.status.code !== 200) {
			throw new Error(
				data.status.description || "Unknown Error from RajaOngkir",
			);
		}

		return data.data || data.rajaongkir?.results || data;
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Unknown error occurred";
		throw new HTTPException(500, {
			message: `RajaOngkir Error: ${message}`,
		});
	}
};

export const getProvincesService = async () => {
	return await fetchRajaOngkir("/destination/province");
};

export const getCitiesService = async (provinceId: string) => {
	return await fetchRajaOngkir(`/destination/city/${provinceId}`);
};

export const getDistrictsService = async (cityId: string) => {
	return await fetchRajaOngkir(`/destination/district/${cityId}`);
};

export const getSubdistrictsService = async (districtId: string) => {
	return await fetchRajaOngkir(`/destination/sub-district/${districtId}`);
};

// ======= DIRECT SEARCH METHOD (Instant Lookup) =======
export const searchDomesticDestinationService = async (
	search: string,
	limit = 10,
	offset = 0,
) => {
	const params = new URLSearchParams({
		search,
		limit: limit.toString(),
		offset: offset.toString(),
	});
	return await fetchRajaOngkir(
		`/destination/domestic-destination?${params.toString()}`,
	);
};

export const searchInternationalDestinationService = async (
	search: string,
	limit = 10,
	offset = 0,
) => {
	const params = new URLSearchParams({
		search,
		limit: limit.toString(),
		offset: offset.toString(),
	});
	return await fetchRajaOngkir(
		`/destination/international-destination?${params.toString()}`,
	);
};

// ======= COST CALCULATION & TRACKING =======
export const calculateShippingCostService = async (params: {
	origin: string;
	destination: string;
	weight: number;
	courier: "jne" | "pos" | "tiki" | string;
}) => {
	const body = new URLSearchParams({
		origin: params.origin,
		destination: params.destination,
		weight: params.weight.toString(),
		courier: params.courier,
	});

	return await fetchRajaOngkir("/calculate/domestic-cost", {
		method: "POST",
		body: body.toString(),
	});
};

export const trackWaybillService = async (
	awb: string,
	courier: string = "",
) => {
	const params = new URLSearchParams({
		awb,
		courier,
	});
	return await fetchRajaOngkir(`/track/waybill?${params.toString()}`, {
		method: "POST", // API Docs indicated POST for this endpoint in Postman collection
	});
};
