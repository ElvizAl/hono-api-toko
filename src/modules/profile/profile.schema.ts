import { z } from "zod";

export const upsertProfileSchema = z.object({
	fullName: z.string().min(1, { message: "Nama lengkap wajib diisi" }),
	phone: z.string().min(1, { message: "Nomor telepon wajib diisi" }),
	address: z.string().min(1, { message: "Alamat lengkap wajib diisi" }),
	cityId: z.string({ message: "ID Kota wajib diisi dari RajaOngkir" }),
	zipcode: z.string().min(1, { message: "Kode pos wajib diisi" }),
});

export type UpsertProfileInput = z.infer<typeof upsertProfileSchema>;
