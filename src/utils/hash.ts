import * as bcrypt from "bcryptjs";

export async function hashPassword(password: string) {
	return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
	return await bcrypt.compare(password, hash);
}

export function hashToken(token: string) {
	return bcrypt.hashSync(token, 10);
}

export function verifyToken(token: string, hash: string) {
	return bcrypt.compareSync(token, hash);
}
