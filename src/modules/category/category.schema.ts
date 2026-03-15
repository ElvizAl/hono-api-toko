import { z } from "zod";

export const categorySchema = z.object({
	name: z.string().min(1, { message: "Nama kategori wajib diisi" }),
});

export type CategoryInput = z.infer<typeof categorySchema>;
