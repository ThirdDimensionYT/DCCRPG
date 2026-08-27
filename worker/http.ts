export const JSON_HEADERS = {
	"content-type": "application/json; charset=utf-8",
	"cache-control": "no-store",
};

export class HttpError extends Error {
	readonly status: number;

	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

export function json(data: unknown, init: ResponseInit = {}): Response {
	return Response.json(data, { ...init, headers: { ...JSON_HEADERS, ...init.headers } });
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
	if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
		throw new HttpError(415, "Expected an application/json request body.");
	}
	const body = await request.json<unknown>();
	if (!body || typeof body !== "object" || Array.isArray(body)) {
		throw new HttpError(400, "Expected a JSON object.");
	}
	return body as Record<string, unknown>;
}

export function stringField(
	input: Record<string, unknown>,
	key: string,
	options: { required?: boolean; min?: number; max?: number } = {},
): string | undefined {
	const value = input[key];
	if (value === undefined || value === null || value === "") {
		if (options.required) throw new HttpError(400, `${key} is required.`);
		return undefined;
	}
	if (typeof value !== "string") throw new HttpError(400, `${key} must be a string.`);
	const trimmed = value.trim();
	if (!trimmed && options.required) throw new HttpError(400, `${key} is required.`);
	if (options.min && trimmed.length < options.min) {
		throw new HttpError(400, `${key} must be at least ${options.min} characters.`);
	}
	if (options.max && trimmed.length > options.max) {
		throw new HttpError(400, `${key} must be ${options.max} characters or fewer.`);
	}
	return trimmed;
}

export function integerField(
	input: Record<string, unknown>,
	key: string,
	options: { min: number; max: number },
): number | undefined {
	const value = input[key];
	if (value === undefined || value === null) return undefined;
	if (!Number.isInteger(value) || (value as number) < options.min || (value as number) > options.max) {
		throw new HttpError(400, `${key} must be an integer from ${options.min} to ${options.max}.`);
	}
	return value as number;
}

export function enforceSameOrigin(request: Request): void {
	const origin = request.headers.get("origin");
	if (!origin || origin !== new URL(request.url).origin) {
		throw new HttpError(403, "Request origin could not be verified.");
	}
}
