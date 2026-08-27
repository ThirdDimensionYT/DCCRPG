import { enforceSameOrigin, HttpError, json, readJson, stringField } from "./http.js";

const encoder = new TextEncoder();
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]{2,31}$/;
const DUMMY_PASSWORD_HASH = "hmac-sha256$v1$invalid-login-salt$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const LOCAL_AUTH_SECRET = "dccrpg-local-development-auth-secret-only";

type AppEnv = Env & { ADMIN_SETUP_TOKEN?: string; AUTH_SECRET?: string };

export type AuthUser = {
	id: string;
	username: string;
	display_name: string;
	role: "admin" | "player";
	is_active: number;
};

type PasswordUser = AuthUser & { password_hash: string };
type LoginAttempt = { failed_count: number; window_started_at: string; blocked_until: string | null };

function bytesToBase64Url(bytes: Uint8Array): string {
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array {
	const base64 = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
	const binary = atob(base64);
	return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function sha256(value: string): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
	return bytesToBase64Url(new Uint8Array(digest));
}

async function secretMatches(provided: string, expected: string): Promise<boolean> {
	const [providedHash, expectedHash] = await Promise.all([
		crypto.subtle.digest("SHA-256", encoder.encode(provided)),
		crypto.subtle.digest("SHA-256", encoder.encode(expected)),
	]);
	return crypto.subtle.timingSafeEqual(providedHash, expectedHash);
}

function authSecret(env: AppEnv, request: Request): string {
	const secret = env.AUTH_SECRET ?? (new URL(request.url).hostname === "localhost" ? LOCAL_AUTH_SECRET : "");
	if (secret.length < 32) throw new HttpError(503, "The application authentication secret has not been configured.");
	return secret;
}

function createHmacKey(secret: string): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign", "verify"],
	);
}

async function hashPassword(password: string, secret: string): Promise<string> {
	const salt = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(16)));
	const signature = await crypto.subtle.sign(
		"HMAC",
		await createHmacKey(secret),
		encoder.encode(`dccrpg-player-password:v1:${salt}:${password}`),
	);
	return `hmac-sha256$v1$${salt}$${bytesToBase64Url(new Uint8Array(signature))}`;
}

async function verifyPassword(password: string, encoded: string, secret: string): Promise<boolean> {
	const [algorithm, version, salt, signature] = encoded.split("$");
	if (algorithm !== "hmac-sha256" || version !== "v1" || !salt || !signature) return false;
	try {
		return await crypto.subtle.verify(
			"HMAC",
			await createHmacKey(secret),
			base64UrlToBytes(signature),
			encoder.encode(`dccrpg-player-password:v1:${salt}:${password}`),
		);
	} catch {
		return false;
	}
}

function normalizeUsername(value: string): string {
	const username = value.trim().toLowerCase();
	if (!USERNAME_PATTERN.test(username)) {
		throw new HttpError(400, "Username must be 3–32 characters using letters, numbers, hyphens, or underscores.");
	}
	return username;
}

function validatePassword(value: string): string {
	if (value.length < 12 || value.length > 128) {
		throw new HttpError(400, "Password must be between 12 and 128 characters.");
	}
	return value;
}

function cookieValue(request: Request, name: string): string | null {
	const cookie = request.headers.get("cookie");
	if (!cookie) return null;
	for (const part of cookie.split(";")) {
		const [key, ...value] = part.trim().split("=");
		if (key === name) return value.join("=");
	}
	return null;
}

function sessionCookie(request: Request, token: string, maxAge = SESSION_SECONDS): string {
	const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
	return `dcc_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

async function createSession(request: Request, env: Env, userId: string): Promise<ResponseInit> {
	const token = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
	const tokenHash = await sha256(token);
	const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();
	await env.DB.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
		.bind(tokenHash, userId, expiresAt)
		.run();
	return { headers: { "set-cookie": sessionCookie(request, token) } };
}

export async function getSessionUser(request: Request, env: Env): Promise<AuthUser | null> {
	const token = cookieValue(request, "dcc_session");
	if (!token) return null;
	const tokenHash = await sha256(token);
	return env.DB.prepare(
		`SELECT u.id, u.username, u.display_name, u.role, u.is_active
		 FROM sessions s
		 JOIN users u ON u.id = s.user_id
		 WHERE s.token_hash = ? AND s.expires_at > ? AND u.is_active = 1 AND u.username IS NOT NULL`,
	)
		.bind(tokenHash, new Date().toISOString())
		.first<AuthUser>();
}

export async function requireUser(request: Request, env: Env): Promise<AuthUser> {
	const user = await getSessionUser(request, env);
	if (!user) throw new HttpError(401, "Please sign in to continue.");
	return user;
}

function requireAdmin(user: AuthUser): void {
	if (user.role !== "admin") throw new HttpError(403, "Administrator access is required.");
}

async function setupRequired(env: Env): Promise<boolean> {
	const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM users WHERE username IS NOT NULL AND password_hash IS NOT NULL")
		.first<{ count: number }>();
	return Number(row?.count ?? 0) === 0;
}

async function authStatus(request: Request, env: Env): Promise<Response> {
	const user = await getSessionUser(request, env);
	return json({
		authenticated: Boolean(user),
		setupRequired: await setupRequired(env),
		user: user ? { id: user.id, username: user.username, displayName: user.display_name, role: user.role } : null,
	});
}

async function setupAdmin(request: Request, env: AppEnv): Promise<Response> {
	enforceSameOrigin(request);
	if (!(await setupRequired(env))) throw new HttpError(409, "Initial setup has already been completed.");
	const raw = await readJson(request);
	const setupToken = stringField(raw, "setupToken", { required: true, max: 256 }) ?? "";
	const expectedToken = env.ADMIN_SETUP_TOKEN ?? (new URL(request.url).hostname === "localhost" ? "local-setup" : "");
	if (!expectedToken) throw new HttpError(503, "The administrator setup token has not been configured.");
	if (!(await secretMatches(setupToken, expectedToken))) throw new HttpError(403, "The setup token is invalid.");
	const username = normalizeUsername(stringField(raw, "username", { required: true, max: 32 }) ?? "");
	const displayName = stringField(raw, "displayName", { required: true, max: 80 }) ?? "";
	const password = validatePassword(stringField(raw, "password", { required: true, max: 128 }) ?? "");
	const userId = crypto.randomUUID();
	const passwordHash = await hashPassword(password, authSecret(env, request));
	try {
		await env.DB.prepare(
			"INSERT INTO users (id, email, display_name, username, password_hash, role) VALUES (?, ?, ?, ?, ?, 'admin')",
		)
			.bind(userId, `${username}@accounts.dccrpg.invalid`, displayName, username, passwordHash)
			.run();
	} catch {
		throw new HttpError(409, "That username is already in use.");
	}
	return json({ ok: true }, await createSession(request, env, userId));
}

function loginAttemptKey(request: Request, username: string): Promise<string> {
	const address = request.headers.get("cf-connecting-ip") ?? "unknown";
	return sha256(`${address}:${username}`);
}

async function recordLoginFailure(env: Env, key: string, current: LoginAttempt | null): Promise<void> {
	const now = new Date();
	const windowStart = current ? new Date(current.window_started_at) : null;
	const withinWindow = Boolean(windowStart && now.getTime() - windowStart.getTime() < 15 * 60 * 1000);
	const failedCount = withinWindow && current ? current.failed_count + 1 : 1;
	const blockedUntil = failedCount >= 5 ? new Date(now.getTime() + 15 * 60 * 1000).toISOString() : null;
	await env.DB.prepare(
		`INSERT INTO login_attempts (attempt_key, failed_count, window_started_at, blocked_until)
		 VALUES (?, ?, ?, ?)
		 ON CONFLICT(attempt_key) DO UPDATE SET failed_count = excluded.failed_count,
		 window_started_at = excluded.window_started_at, blocked_until = excluded.blocked_until`,
	)
		.bind(key, failedCount, withinWindow && current ? current.window_started_at : now.toISOString(), blockedUntil)
		.run();
}

async function login(request: Request, env: AppEnv): Promise<Response> {
	enforceSameOrigin(request);
	const raw = await readJson(request);
	const username = normalizeUsername(stringField(raw, "username", { required: true, max: 32 }) ?? "");
	const password = stringField(raw, "password", { required: true, max: 128 }) ?? "";
	const attemptKey = await loginAttemptKey(request, username);
	const attempt = await env.DB.prepare(
		"SELECT failed_count, window_started_at, blocked_until FROM login_attempts WHERE attempt_key = ?",
	)
		.bind(attemptKey)
		.first<LoginAttempt>();
	if (attempt?.blocked_until && attempt.blocked_until > new Date().toISOString()) {
		throw new HttpError(429, "Too many sign-in attempts. Try again in 15 minutes.");
	}
	const user = await env.DB.prepare(
		`SELECT id, username, display_name, role, is_active, password_hash
		 FROM users WHERE username = ? AND password_hash IS NOT NULL`,
	)
		.bind(username)
		.first<PasswordUser>();
	const valid = await verifyPassword(password, user?.password_hash ?? DUMMY_PASSWORD_HASH, authSecret(env, request));
	if (!user || !valid || user.is_active !== 1) {
		await recordLoginFailure(env, attemptKey, attempt);
		throw new HttpError(401, "Username or password is incorrect.");
	}
	await env.DB.prepare("DELETE FROM login_attempts WHERE attempt_key = ?").bind(attemptKey).run();
	return json({ ok: true }, await createSession(request, env, user.id));
}

async function logout(request: Request, env: Env): Promise<Response> {
	enforceSameOrigin(request);
	const token = cookieValue(request, "dcc_session");
	if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
	return json({ ok: true }, { headers: { "set-cookie": sessionCookie(request, "", 0) } });
}

async function changePassword(request: Request, env: AppEnv): Promise<Response> {
	enforceSameOrigin(request);
	const user = await requireUser(request, env);
	const raw = await readJson(request);
	const currentPassword = stringField(raw, "currentPassword", { required: true, max: 128 }) ?? "";
	const newPassword = validatePassword(stringField(raw, "newPassword", { required: true, max: 128 }) ?? "");
	const passwordUser = await env.DB.prepare("SELECT password_hash FROM users WHERE id = ? AND password_hash IS NOT NULL")
		.bind(user.id)
		.first<{ password_hash: string }>();
	const secret = authSecret(env, request);
	if (!passwordUser || !(await verifyPassword(currentPassword, passwordUser.password_hash, secret))) {
		throw new HttpError(401, "Your current password is incorrect.");
	}
	if (await verifyPassword(newPassword, passwordUser.password_hash, secret)) {
		throw new HttpError(400, "Your new password must be different from your current password.");
	}
	await env.DB.batch([
		env.DB.prepare("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
			.bind(await hashPassword(newPassword, secret), user.id),
		env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user.id),
	]);
	return json({ ok: true }, await createSession(request, env, user.id));
}

async function listUsers(request: Request, env: Env): Promise<Response> {
	const admin = await requireUser(request, env);
	requireAdmin(admin);
	const result = await env.DB.prepare(
		`SELECT id, username, display_name, role, is_active, created_at
		 FROM users WHERE username IS NOT NULL ORDER BY role ASC, display_name COLLATE NOCASE ASC`,
	).all();
	return json({ users: result.results });
}

async function createUser(request: Request, env: AppEnv): Promise<Response> {
	enforceSameOrigin(request);
	const admin = await requireUser(request, env);
	requireAdmin(admin);
	const raw = await readJson(request);
	const username = normalizeUsername(stringField(raw, "username", { required: true, max: 32 }) ?? "");
	const displayName = stringField(raw, "displayName", { required: true, max: 80 }) ?? "";
	const password = validatePassword(stringField(raw, "password", { required: true, max: 128 }) ?? "");
	const userId = crypto.randomUUID();
	try {
		await env.DB.prepare(
			"INSERT INTO users (id, email, display_name, username, password_hash) VALUES (?, ?, ?, ?, ?)",
		)
			.bind(userId, `${username}@accounts.dccrpg.invalid`, displayName, username, await hashPassword(password, authSecret(env, request)))
			.run();
	} catch {
		throw new HttpError(409, "That username is already in use.");
	}
	return json({ id: userId }, { status: 201 });
}

async function resetPassword(request: Request, env: AppEnv, userId: string): Promise<Response> {
	enforceSameOrigin(request);
	const admin = await requireUser(request, env);
	requireAdmin(admin);
	const raw = await readJson(request);
	const password = validatePassword(stringField(raw, "password", { required: true, max: 128 }) ?? "");
	const result = await env.DB.batch([
		env.DB.prepare("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND username IS NOT NULL")
			.bind(await hashPassword(password, authSecret(env, request)), userId),
		env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId),
	]);
	if (!result[0].meta.changes) throw new HttpError(404, "Player account not found.");
	return json({ ok: true, signedOut: userId === admin.id });
}

async function setUserActive(request: Request, env: Env, userId: string): Promise<Response> {
	enforceSameOrigin(request);
	const admin = await requireUser(request, env);
	requireAdmin(admin);
	if (userId === admin.id) throw new HttpError(400, "You cannot disable your own administrator account.");
	const raw = await readJson(request);
	if (typeof raw.active !== "boolean") throw new HttpError(400, "active must be true or false.");
	const result = await env.DB.batch([
		env.DB.prepare("UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND username IS NOT NULL")
			.bind(raw.active ? 1 : 0, userId),
		env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId),
	]);
	if (!result[0].meta.changes) throw new HttpError(404, "Player account not found.");
	return json({ ok: true });
}

export async function handleAuthRoute(request: Request, env: AppEnv): Promise<Response | null> {
	const url = new URL(request.url);
	if (request.method === "GET" && url.pathname === "/api/auth/status") return authStatus(request, env);
	if (request.method === "POST" && url.pathname === "/api/auth/setup") return setupAdmin(request, env);
	if (request.method === "POST" && url.pathname === "/api/auth/login") return login(request, env);
	if (request.method === "POST" && url.pathname === "/api/auth/logout") return logout(request, env);
	if (request.method === "POST" && url.pathname === "/api/auth/password") return changePassword(request, env);
	if (request.method === "GET" && url.pathname === "/api/admin/users") return listUsers(request, env);
	if (request.method === "POST" && url.pathname === "/api/admin/users") return createUser(request, env);
	const resetMatch = url.pathname.match(/^\/api\/admin\/users\/([^/]+)\/password$/);
	if (request.method === "POST" && resetMatch) return resetPassword(request, env, decodeURIComponent(resetMatch[1]));
	const activeMatch = url.pathname.match(/^\/api\/admin\/users\/([^/]+)\/active$/);
	if (request.method === "POST" && activeMatch) return setUserActive(request, env, decodeURIComponent(activeMatch[1]));
	return null;
}
