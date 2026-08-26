type UserRow = { id: string; email: string; display_name: string };

type CampaignRow = {
	id: string;
	name: string;
	description: string;
	floor: number;
	status: "active" | "paused" | "complete";
	member_count: number;
	character_count: number;
};

type CharacterRow = {
	id: string;
	name: string;
	crawler_number: number;
	race: string;
	class_name: string;
	level: number;
	floor: number;
	campaign_id: string | null;
	campaign_name: string | null;
	strength: number;
	intelligence: number;
	constitution: number;
	dexterity: number;
	charisma: number;
	current_mana: number;
	health_slots_lost: number;
	ai_favor: number;
	popularity: number;
	size_name: string;
	size_value: number;
	move: number;
	step: number;
	past_trauma: string;
	loose_end: string;
	regret: string;
};

type SkillRow = {
	id: string;
	character_id: string;
	name: string;
	rank: number;
	stat: string | null;
	check_type: string;
	advancement_marked: number;
};

const JSON_HEADERS = {
	"content-type": "application/json; charset=utf-8",
	"cache-control": "no-store",
};

class HttpError extends Error {
	readonly status: number;

	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

function json(data: unknown, init: ResponseInit = {}): Response {
	return Response.json(data, { ...init, headers: { ...JSON_HEADERS, ...init.headers } });
}

function getIdentity(request: Request): { email: string; displayName: string } {
	const accessEmail = request.headers.get("cf-access-authenticated-user-email")?.trim().toLowerCase();
	if (accessEmail) {
		return { email: accessEmail, displayName: accessEmail.split("@")[0] || "Crawler" };
	}

	const hostname = new URL(request.url).hostname;
	if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
		return { email: "local-crawler@dccrpg.test", displayName: "Local Crawler" };
	}

	throw new HttpError(401, "Sign in through Cloudflare Access to continue.");
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
	if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
		throw new HttpError(415, "Expected an application/json request body.");
	}
	const body = await request.json<unknown>();
	if (!body || typeof body !== "object" || Array.isArray(body)) {
		throw new HttpError(400, "Expected a JSON object.");
	}
	return body as Record<string, unknown>;
}

function stringField(
	input: Record<string, unknown>,
	key: string,
	options: { required?: boolean; max?: number } = {},
): string | undefined {
	const value = input[key];
	if (value === undefined || value === null || value === "") {
		if (options.required) throw new HttpError(400, `${key} is required.`);
		return undefined;
	}
	if (typeof value !== "string") throw new HttpError(400, `${key} must be a string.`);
	const trimmed = value.trim();
	if (!trimmed && options.required) throw new HttpError(400, `${key} is required.`);
	if (options.max && trimmed.length > options.max) {
		throw new HttpError(400, `${key} must be ${options.max} characters or fewer.`);
	}
	return trimmed;
}

function integerField(
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

async function getOrCreateUser(env: Env, email: string, displayName: string): Promise<UserRow> {
	const existing = await env.DB.prepare("SELECT id, email, display_name FROM users WHERE email = ?")
		.bind(email)
		.first<UserRow>();
	if (existing) return existing;

	const id = crypto.randomUUID();
	await env.DB.prepare("INSERT INTO users (id, email, display_name) VALUES (?, ?, ?)")
		.bind(id, email, displayName)
		.run();
	return { id, email, display_name: displayName };
}

async function listCampaigns(env: Env, userId: string): Promise<CampaignRow[]> {
	const result = await env.DB.prepare(
		`SELECT c.id, c.name, c.description, c.floor, c.status,
			COUNT(DISTINCT cm.user_id) AS member_count,
			COUNT(DISTINCT ch.id) AS character_count
		 FROM campaigns c
		 JOIN campaign_members mine ON mine.campaign_id = c.id AND mine.user_id = ?
		 LEFT JOIN campaign_members cm ON cm.campaign_id = c.id
		 LEFT JOIN characters ch ON ch.campaign_id = c.id
		 GROUP BY c.id
		 ORDER BY c.updated_at DESC`,
	)
		.bind(userId)
		.all<CampaignRow>();
	return result.results;
}

async function listCharacters(env: Env, userId: string): Promise<Array<CharacterRow & { skills: SkillRow[] }>> {
	const [charactersResult, skillsResult] = await env.DB.batch([
		env.DB.prepare(
			`SELECT ch.*, c.name AS campaign_name
			 FROM characters ch
			 LEFT JOIN campaigns c ON c.id = ch.campaign_id
			 WHERE ch.owner_id = ?
			 ORDER BY ch.updated_at DESC`,
		).bind(userId),
		env.DB.prepare(
			`SELECT s.id, s.character_id, s.name, s.rank, s.stat, s.check_type, s.advancement_marked
			 FROM character_skills s
			 JOIN characters ch ON ch.id = s.character_id
			 WHERE ch.owner_id = ?
			 ORDER BY s.rank DESC, s.name ASC`,
		).bind(userId),
	]);
	const skills = skillsResult.results as SkillRow[];
	return (charactersResult.results as CharacterRow[]).map((character) => ({
		...character,
		skills: skills.filter((skill) => skill.character_id === character.id),
	}));
}

async function bootstrap(env: Env, user: UserRow): Promise<Response> {
	const [campaigns, characters] = await Promise.all([
		listCampaigns(env, user.id),
		listCharacters(env, user.id),
	]);
	return json({
		user: { id: user.id, email: user.email, displayName: user.display_name },
		campaigns,
		characters,
	});
}

async function createCampaign(request: Request, env: Env, user: UserRow): Promise<Response> {
	const raw = await readJson(request);
	const name = stringField(raw, "name", { required: true, max: 80 }) ?? "";
	const description = stringField(raw, "description", { max: 500 }) ?? "";
	const floor = integerField(raw, "floor", { min: 1, max: 18 }) ?? 3;
	const campaignId = crypto.randomUUID();

	await env.DB.batch([
		env.DB.prepare(
			"INSERT INTO campaigns (id, owner_id, name, description, floor) VALUES (?, ?, ?, ?, ?)",
		).bind(campaignId, user.id, name, description, floor),
		env.DB.prepare(
			"INSERT INTO campaign_members (campaign_id, user_id, role) VALUES (?, ?, 'gm')",
		).bind(campaignId, user.id),
	]);
	return json({ id: campaignId }, { status: 201 });
}

async function createCharacter(request: Request, env: Env, user: UserRow): Promise<Response> {
	const raw = await readJson(request);
	const name = stringField(raw, "name", { required: true, max: 80 }) ?? "";
	const crawlerNumber = integerField(raw, "crawlerNumber", { min: 1, max: 12_900_000 }) ?? 500_000;
	const race = stringField(raw, "race", { max: 80 }) ?? "Human";
	const className = stringField(raw, "className", { max: 80 }) ?? "Unselected";
	const campaignId = stringField(raw, "campaignId", { max: 64 }) ?? null;

	if (campaignId) {
		const membership = await env.DB.prepare(
			"SELECT 1 AS allowed FROM campaign_members WHERE campaign_id = ? AND user_id = ?",
		)
			.bind(campaignId, user.id)
			.first<{ allowed: number }>();
		if (!membership) throw new HttpError(403, "You are not a member of that campaign.");
	}

	const characterId = crypto.randomUUID();
	await env.DB.batch([
		env.DB.prepare(
			`INSERT INTO characters
			 (id, owner_id, campaign_id, name, crawler_number, race, class_name)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		).bind(characterId, user.id, campaignId, name, crawlerNumber, race, className),
		env.DB.prepare(
			`INSERT INTO character_skills (id, character_id, name, rank, stat, check_type)
			 VALUES (?, ?, 'Unarmed Combat', 3, 'STR', 'Evade')`,
		).bind(crypto.randomUUID(), characterId),
		env.DB.prepare(
			`INSERT INTO character_skills (id, character_id, name, rank, stat, check_type)
			 VALUES (?, ?, 'Heal', 1, 'INT', 'Interrupt')`,
		).bind(crypto.randomUUID(), characterId),
	]);
	return json({ id: characterId }, { status: 201 });
}

async function handleApi(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	if (request.method === "GET" && url.pathname === "/api/health") {
		return json({ status: "ok", service: "dccrpg" });
	}

	const identity = getIdentity(request);
	const user = await getOrCreateUser(env, identity.email, identity.displayName);
	if (request.method === "GET" && url.pathname === "/api/bootstrap") return bootstrap(env, user);
	if (request.method === "POST" && url.pathname === "/api/campaigns") return createCampaign(request, env, user);
	if (request.method === "POST" && url.pathname === "/api/characters") return createCharacter(request, env, user);
	throw new HttpError(404, "API route not found.");
}

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);
		if (!url.pathname.startsWith("/api/")) return new Response(null, { status: 404 });
		try {
			return await handleApi(request, env);
		} catch (error) {
			if (error instanceof HttpError) return json({ error: error.message }, { status: error.status });
			console.error(JSON.stringify({
				message: "request failed",
				path: url.pathname,
				error: error instanceof Error ? error.message : String(error),
			}));
			return json({ error: "Internal server error." }, { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;
