import { HTTPException } from "hono/http-exception";
import * as jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { AccessTokenPayload, RefreshTokenPayload } from "../types";

export function signAccessToken(payload: AccessTokenPayload) {
	return jwt.sign(payload, env.JWT_SECRET, {
		expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
	});
}

export function verifyAccessToken(token: string): AccessTokenPayload {
	try {
		return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
	} catch {
		throw new HTTPException(401, {
			message: "Token tidak valid atau kadaluarsa",
		});
	}
}

export function signRefreshToken(payload: RefreshTokenPayload) {
	return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
		expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
	});
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
	try {
		return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
	} catch {
		throw new HTTPException(401, {
			message: "Token tidak valid atau kadaluarsa",
		});
	}
}
