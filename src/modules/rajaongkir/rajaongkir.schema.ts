import { z } from "zod";

export const getCityParamSchema = z.object({
	provinceId: z.string({ message: "Province ID wajib diisi" }),
});

export const getDistrictParamSchema = z.object({
	cityId: z.string({ message: "City ID wajib diisi" }),
});

export const getSubdistrictParamSchema = z.object({
	districtId: z.string({ message: "District ID wajib diisi" }),
});

export const searchDestinationSchema = z.object({
	search: z.string({ message: "Kata kunci pencarian tujuan wajib diisi" }),
	limit: z.coerce.number().optional().default(10),
	offset: z.coerce.number().optional().default(0),
});

export const trackWaybillSchema = z.object({
	awb: z.string({ message: "Nomor resi (Airwaybill) wajib diisi" }),
	courier: z.string().optional().default(""),
});

export const calculateCostSchema = z.object({
	origin: z.string({ message: "Origin wajib diisi" }),
	destination: z.string({ message: "Destination wajib diisi" }),
	weight: z.number({ message: "Berat barang wajib diisi (gram)" }),
	courier: z.string({ message: "Kurir wajib diisi (contoh: jne:sicepat:pos)" }),
});
