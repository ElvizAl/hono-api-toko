import { HTTPException } from "hono/http-exception";
import { prisma } from "../../utils/prisma";
import type { UpsertProfileInput } from "./profile.schema";

export const getMyProfileService = async (userId: string) => {
	const profile = await prisma.profile.findUnique({
		where: { userId },
	});

	if (!profile) {
		throw new HTTPException(404, { message: "Profil belum diisi" });
	}

	return {
		message: "Berhasil mengambil data profil",
		data: profile,
	};
};

export const upsertProfileService = async (
	userId: string,
	data: UpsertProfileInput,
) => {
	const profile = await prisma.profile.upsert({
		where: { userId },
		update: {
			fullName: data.fullName,
			phone: data.phone,
			address: data.address,
			cityId: data.cityId,
			zipcode: data.zipcode,
		},
		create: {
			userId: userId,
			fullName: data.fullName,
			phone: data.phone,
			address: data.address,
			cityId: data.cityId,
			zipcode: data.zipcode,
		},
	});

	return {
		message: "Profil berhasil disimpan",
		data: profile,
	};
};

// ========================
// ADMIN SERVICES
// ========================

export const getAllProfilesService = async () => {
	const profiles = await prisma.profile.findMany({
		include: {
			user: {
				select: { id: true, name: true, email: true, role: true },
			},
		},
		orderBy: { createdAt: "desc" },
	});

	return {
		message: "Berhasil mengambil semua profil (Admin)",
		data: profiles,
	};
};

export const getProfileByIdService = async (id: string) => {
	const profile = await prisma.profile.findUnique({
		where: { id },
		include: {
			user: {
				select: { id: true, name: true, email: true, role: true },
			},
		},
	});

	if (!profile) {
		throw new HTTPException(404, { message: "Profil tidak ditemukan" });
	}

	return {
		message: "Berhasil mengambil profil (Admin)",
		data: profile,
	};
};

export const updateProfileService = async (
	id: string,
	data: UpsertProfileInput,
) => {
	const existingProfile = await prisma.profile.findUnique({
		where: { id },
	});

	if (!existingProfile) {
		throw new HTTPException(404, { message: "Profil tidak ditemukan" });
	}

	const updatedProfile = await prisma.profile.update({
		where: { id },
		data: {
			fullName: data.fullName,
			phone: data.phone,
			address: data.address,
			cityId: data.cityId,
			zipcode: data.zipcode,
		},
	});

	return {
		message: "Profil berhasil diperbarui (Admin)",
		data: updatedProfile,
	};
};

export const deleteProfileService = async (id: string) => {
	const existingProfile = await prisma.profile.findUnique({
		where: { id },
	});

	if (!existingProfile) {
		throw new HTTPException(404, { message: "Profil tidak ditemukan" });
	}

	await prisma.profile.delete({
		where: { id },
	});

	return {
		message: "Profil berhasil dihapus (Admin)",
	};
};
