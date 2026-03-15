import { HTTPException } from "hono/http-exception";
import { prisma } from "../../utils/prisma";
import type { CategoryInput } from "./category.schema";

export const getAllCategoriesService = async () => {
	const categories = await prisma.category.findMany({
		orderBy: { createdAt: "desc" },
	});
	return {
		message: "Berhasil mengambil daftar kategori",
		data: categories,
	};
};

export const createCategoryService = async (data: CategoryInput) => {
	const existingCategory = await prisma.category.findUnique({
		where: { name: data.name },
	});

	if (existingCategory) {
		throw new HTTPException(400, { message: "Kategori sudah ada" });
	}

	const category = await prisma.category.create({
		data: { name: data.name },
	});

	return {
		message: "Kategori berhasil dibuat",
		data: category,
	};
};

export const updateCategoryService = async (
	id: string,
	data: CategoryInput,
) => {
	const existingCategory = await prisma.category.findUnique({
		where: { id },
	});

	if (!existingCategory) {
		throw new HTTPException(404, { message: "Kategori tidak ditemukan" });
	}

	const checkName = await prisma.category.findFirst({
		where: {
			name: data.name,
			NOT: { id }, // Pastikan tidak mengecek nama aslinya sendiri
		},
	});

	if (checkName) {
		throw new HTTPException(400, { message: "Nama kategori sudah digunakan" });
	}

	const category = await prisma.category.update({
		where: { id },
		data: { name: data.name },
	});

	return {
		message: "Kategori berhasil diperbarui",
		data: category,
	};
};

export const deleteCategoryService = async (id: string) => {
	// Prisma by default throws unhandled error if deleting non-existent row
	const existingCategory = await prisma.category.findUnique({
		where: { id },
	});

	if (!existingCategory) {
		throw new HTTPException(404, { message: "Kategori tidak ditemukan" });
	}

	await prisma.category.delete({
		where: { id },
	});

	return {
		message: "Kategori berhasil dihapus",
	};
};
