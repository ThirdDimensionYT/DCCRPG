import { handleAuthRoute, requireUser, type AuthUser } from "./auth.js";
import { enforceSameOrigin, HttpError, integerField, json, readJson, stringField } from "./http.js";
import {
	calculateStats,
	CLASS_NAMES,
	LEVEL_OPTIONS,
	OPTION_STAT_RULES,
	RACE_NAMES,
	SKILL_NAMES,
	STAT_KEYS,
	type StatBlock,
} from "../shared/rules.js";

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
	owner_id: string;
	name: string;
	crawler_number: number;
	race: string;
	class_name: string;
	gender_pronouns: string;
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
	notes: string;
	art_key: string | null;
	sheet_data: string;
	owner_display_name: string;
	owner_username: string | null;
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

const RULEBOOK_KEY = "rulebook/dungeon-crawler-carl-rpg-core-rulebook.pdf";

async function listCampaigns(env: Env, user: AuthUser): Promise<CampaignRow[]> {
	const membershipJoin = user.role === "admin" ? "" : "JOIN campaign_members mine ON mine.campaign_id = c.id AND mine.user_id = ?";
	const result = await env.DB.prepare(
		`SELECT c.id, c.name, c.description, c.floor, c.status,
			COUNT(DISTINCT cm.user_id) AS member_count,
			COUNT(DISTINCT ch.id) AS character_count
		 FROM campaigns c
		 ${membershipJoin}
		 LEFT JOIN campaign_members cm ON cm.campaign_id = c.id
		 LEFT JOIN characters ch ON ch.campaign_id = c.id
		 GROUP BY c.id
		 ORDER BY c.updated_at DESC`,
	);
	const query = user.role === "admin" ? result : result.bind(user.id);
	const rows = await query.all<CampaignRow>();
	return rows.results;
}

async function listCharacters(env: Env, user: AuthUser): Promise<Array<CharacterRow & { skills: SkillRow[] }>> {
	const ownerFilter = user.role === "admin" ? "" : "WHERE ch.owner_id = ?";
	const charactersStatement = env.DB.prepare(
		`SELECT ch.*, c.name AS campaign_name, u.display_name AS owner_display_name, u.username AS owner_username
		 FROM characters ch
		 LEFT JOIN campaigns c ON c.id = ch.campaign_id
		 JOIN users u ON u.id = ch.owner_id
		 ${ownerFilter}
		 ORDER BY ch.updated_at DESC`,
	);
	const skillsStatement = env.DB.prepare(
		`SELECT s.id, s.character_id, s.name, s.rank, s.stat, s.check_type, s.advancement_marked
		 FROM character_skills s
		 JOIN characters ch ON ch.id = s.character_id
		 ${ownerFilter}
		 ORDER BY s.rank DESC, s.name ASC`,
	);
	const [charactersResult, skillsResult] = await env.DB.batch([
		user.role === "admin" ? charactersStatement : charactersStatement.bind(user.id),
		user.role === "admin" ? skillsStatement : skillsStatement.bind(user.id),
	]);
	const skills = skillsResult.results as SkillRow[];
	return (charactersResult.results as CharacterRow[]).map((character) => ({
		...character,
		skills: skills.filter((skill) => skill.character_id === character.id),
	}));
}

async function bootstrap(env: Env, user: AuthUser): Promise<Response> {
	const [campaigns, characters] = await Promise.all([
		listCampaigns(env, user),
		listCharacters(env, user),
	]);
	return json({
		user: { id: user.id, username: user.username, displayName: user.display_name, role: user.role },
		campaigns,
		characters,
	});
}

async function createCampaign(request: Request, env: Env, user: AuthUser): Promise<Response> {
	enforceSameOrigin(request);
	if (user.role !== "admin") throw new HttpError(403, "Only the owner can create campaigns.");
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

function statBlockField(raw: Record<string, unknown>, key: string): StatBlock {
	const value = raw[key];
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new HttpError(400, `${key} must contain all five Stats.`);
	}
	return Object.fromEntries(STAT_KEYS.map((stat) => {
		const score = (value as Record<string, unknown>)[stat];
		if (!Number.isInteger(score) || (score as number) < 0 || (score as number) > 999) {
			throw new HttpError(400, `${key}.${stat} must be a whole number from 0 to 999.`);
		}
		return [stat, score as number];
	})) as StatBlock;
}

function statTotal(stats: StatBlock): number {
	return STAT_KEYS.reduce((total, key) => total + stats[key], 0);
}

function sameScores(left: number[], right: number[]): boolean {
	return [...left].sort((a, b) => a - b).join(",") === [...right].sort((a, b) => a - b).join(",");
}

function validateFlexibleStats(source: string, allocation: StatBlock, label: string): void {
	const rule = OPTION_STAT_RULES[source]?.flexible;
	if (!rule) {
		if (statTotal(allocation) !== 0) throw new HttpError(400, `${label} does not grant flexible Stat points.`);
		return;
	}
	if (statTotal(allocation) !== rule.points) throw new HttpError(400, `Allocate all ${rule.points} ${rule.label}.`);
	for (const stat of STAT_KEYS) {
		if (!rule.stats.includes(stat) && allocation[stat] !== 0) {
			throw new HttpError(400, `${rule.label} cannot be assigned to ${stat}.`);
		}
	}
	if (rule.allToOne && rule.stats.filter((stat) => allocation[stat] === rule.points).length !== 1) {
		throw new HttpError(400, `${rule.label} must all be assigned to one allowed Stat.`);
	}
}

function statModifier(score: number): number {
	if (score >= 300) return 10;
	if (score >= 200) return 9;
	if (score >= 150) return 8;
	if (score >= 100) return 7;
	if (score >= 50) return 6;
	if (score >= 20) return 5;
	if (score >= 10) return 4;
	if (score >= 6) return 3;
	if (score >= 3) return 2;
	return 1;
}

async function createCharacter(request: Request, env: Env, user: AuthUser): Promise<Response> {
	enforceSameOrigin(request);
	const raw = await readJson(request);
	const name = stringField(raw, "name", { required: true, max: 80 }) ?? "";
	const crawlerNumber = integerField(raw, "crawlerNumber", { min: 1, max: 12_900_000 }) ?? 500_000;
	const race = stringField(raw, "race", { max: 80 }) ?? "Human";
	const className = stringField(raw, "className", { max: 80 }) ?? "Unselected";
	const campaignId = stringField(raw, "campaignId", { max: 64 }) ?? null;
	const level = integerField(raw, "level", { min: 10, max: 30 });
	const levelOption = LEVEL_OPTIONS.find((option) => option.level === level);
	if (!levelOption) throw new HttpError(400, "Choose the Level 10, 20, or 30 creation package.");
	if (!RACE_NAMES.has(race)) throw new HttpError(400, "Choose a race from the rulebook list.");
	if (!CLASS_NAMES.has(className)) throw new HttpError(400, "Choose a class from the rulebook list.");
	if (!Array.isArray(raw.skillNames) || raw.skillNames.length < levelOption.minimumSkills || raw.skillNames.length > 8) {
		throw new HttpError(400, `Choose between ${levelOption.minimumSkills} and 8 starting skills for Level ${levelOption.level}.`);
	}
	const skillNames = raw.skillNames.map((value) => {
		if (typeof value !== "string" || !SKILL_NAMES.has(value)) throw new HttpError(400, "Choose skills from the rulebook list.");
		return value;
	});
	if (new Set(skillNames).size !== skillNames.length) throw new HttpError(400, "Each starting skill can only be chosen once.");

	const statMethod = raw.statMethod;
	if (statMethod !== "standard" && statMethod !== "manual") throw new HttpError(400, "Choose standard array or manual roll for starting Stats.");
	const baseStats = statBlockField(raw, "baseStats");
	const levelStatPoints = statBlockField(raw, "levelStatPoints");
	const raceFlexibleStats = statBlockField(raw, "raceFlexibleStats");
	const classFlexibleStats = statBlockField(raw, "classFlexibleStats");
	const baseScores = STAT_KEYS.map((key) => baseStats[key]);
	let rolledValues: number[] = [];
	if (statMethod === "standard") {
		if (!sameScores(baseScores, [2, 3, 4, 5, 6])) throw new HttpError(400, "The standard array must use 2, 3, 4, 5, and 6 exactly once.");
	} else {
		if (!Array.isArray(raw.rolledValues) || raw.rolledValues.length !== 5 || raw.rolledValues.some((score) => !Number.isInteger(score) || (score as number) < 2 || (score as number) > 6)) {
			throw new HttpError(400, "Manual starting Stats must contain five d6 results from 2 to 6.");
		}
		rolledValues = raw.rolledValues as number[];
		if (!sameScores(baseScores, rolledValues)) throw new HttpError(400, "Assign each rolled Stat result exactly once.");
	}
	if (statTotal(levelStatPoints) !== levelOption.statPoints) {
		throw new HttpError(400, `Distribute exactly ${levelOption.statPoints} level-up Stat points.`);
	}
	validateFlexibleStats(race, raceFlexibleStats, "This race");
	validateFlexibleStats(className, classFlexibleStats, "This class");
	const finalStats = calculateStats(baseStats, levelStatPoints, race, className, raceFlexibleStats, classFlexibleStats);
	const popularity = statModifier(finalStats.charisma) * (levelOption.level === 10 ? 2 : 3);
	const sheetData = JSON.stringify({
		unenhancedStats: finalStats,
		creation: { statMethod, rolledValues, baseStats, levelStatPoints, raceFlexibleStats, classFlexibleStats, levelPackage: levelOption.level },
	});

	if (campaignId && user.role !== "admin") {
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
			 (id, owner_id, campaign_id, name, crawler_number, race, class_name, level, floor,
			  strength, intelligence, constitution, dexterity, charisma, current_mana, popularity, sheet_data)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		).bind(characterId, user.id, campaignId, name, crawlerNumber, race, className, levelOption.level, levelOption.floor,
			finalStats.strength, finalStats.intelligence, finalStats.constitution, finalStats.dexterity, finalStats.charisma,
			finalStats.intelligence, popularity, sheetData),
		...skillNames.map((skillName) => env.DB.prepare(
			`INSERT INTO character_skills (id, character_id, name, rank, stat, check_type)
			 VALUES (?, ?, ?, 1, NULL, 'Unopposed')`,
		).bind(crypto.randomUUID(), characterId, skillName)),
	]);
	return json({ id: characterId }, { status: 201 });
}

async function editableCharacter(env: Env, user: AuthUser, characterId: string): Promise<CharacterRow> {
	const character = await env.DB.prepare("SELECT * FROM characters WHERE id = ?")
		.bind(characterId)
		.first<CharacterRow>();
	if (!character) throw new HttpError(404, "Character not found.");
	if (user.role !== "admin" && character.owner_id !== user.id) {
		throw new HttpError(403, "You cannot edit this character.");
	}
	return character;
}

async function updateCharacter(request: Request, env: Env, user: AuthUser, characterId: string): Promise<Response> {
	enforceSameOrigin(request);
	await editableCharacter(env, user, characterId);
	const raw = await readJson(request);
	const values = {
		name: stringField(raw, "name", { required: true, max: 80 }) ?? "",
		crawlerNumber: integerField(raw, "crawlerNumber", { min: 1, max: 12_900_000 }) ?? 1,
		race: stringField(raw, "race", { required: true, max: 80 }) ?? "Human",
		className: stringField(raw, "className", { required: true, max: 80 }) ?? "Unselected",
		genderPronouns: stringField(raw, "genderPronouns", { max: 80 }) ?? "",
		level: integerField(raw, "level", { min: 1, max: 250 }) ?? 1,
		floor: integerField(raw, "floor", { min: 1, max: 18 }) ?? 1,
		strength: integerField(raw, "strength", { min: 1, max: 999 }) ?? 1,
		intelligence: integerField(raw, "intelligence", { min: 1, max: 999 }) ?? 1,
		constitution: integerField(raw, "constitution", { min: 1, max: 999 }) ?? 1,
		dexterity: integerField(raw, "dexterity", { min: 1, max: 999 }) ?? 1,
		charisma: integerField(raw, "charisma", { min: 1, max: 999 }) ?? 1,
		aiFavor: integerField(raw, "aiFavor", { min: 0, max: 999 }) ?? 0,
		popularity: integerField(raw, "popularity", { min: 0, max: 999 }) ?? 0,
		sizeName: stringField(raw, "sizeName", { required: true, max: 40 }) ?? "Medium",
		sizeValue: integerField(raw, "sizeValue", { min: 0, max: 999 }) ?? 0,
		move: integerField(raw, "move", { min: 0, max: 9999 }) ?? 0,
		step: integerField(raw, "step", { min: 0, max: 9999 }) ?? 0,
		currentMana: integerField(raw, "currentMana", { min: 0, max: 999 }) ?? 0,
		healthSlotsLost: integerField(raw, "healthSlotsLost", { min: 0, max: 10 }) ?? 0,
		pastTrauma: stringField(raw, "pastTrauma", { max: 500 }) ?? "",
		looseEnd: stringField(raw, "looseEnd", { max: 500 }) ?? "",
		regret: stringField(raw, "regret", { max: 500 }) ?? "",
		notes: stringField(raw, "notes", { max: 5000 }) ?? "",
	};
	const sheetData = raw.sheetData ?? {};
	if (!sheetData || typeof sheetData !== "object" || Array.isArray(sheetData)) {
		throw new HttpError(400, "sheetData must be an object.");
	}
	const encodedSheetData = JSON.stringify(sheetData);
	if (encodedSheetData.length > 200_000) throw new HttpError(413, "Character sheet data is too large.");
	await env.DB.prepare(
		`UPDATE characters SET name=?, crawler_number=?, race=?, class_name=?, gender_pronouns=?, level=?, floor=?, strength=?, intelligence=?,
		 constitution=?, dexterity=?, charisma=?, ai_favor=?, popularity=?, size_name=?, size_value=?, move=?, step=?,
		 current_mana=?, health_slots_lost=?, past_trauma=?, loose_end=?, regret=?,
		 notes=?, sheet_data=?, version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
	).bind(values.name, values.crawlerNumber, values.race, values.className, values.genderPronouns, values.level, values.floor,
		values.strength, values.intelligence, values.constitution, values.dexterity, values.charisma,
		values.aiFavor, values.popularity, values.sizeName, values.sizeValue, values.move, values.step,
		values.currentMana, values.healthSlotsLost, values.pastTrauma, values.looseEnd, values.regret, values.notes,
		encodedSheetData, characterId).run();
	return json({ ok: true });
}

async function uploadCharacterArt(request: Request, env: Env, user: AuthUser, characterId: string): Promise<Response> {
	enforceSameOrigin(request);
	const character = await editableCharacter(env, user, characterId);
	const contentType = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
	const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
	const extension = extensions[contentType];
	if (!extension) throw new HttpError(415, "Character art must be a JPG, PNG, or WebP image.");
	const size = Number(request.headers.get("content-length") ?? 0);
	if (!size || size > 5 * 1024 * 1024) throw new HttpError(413, "Character art must be 5 MB or smaller.");
	if (!request.body) throw new HttpError(400, "No image was uploaded.");
	const key = `characters/${characterId}/${crypto.randomUUID()}.${extension}`;
	await env.CHARACTER_ART.put(key, request.body, { httpMetadata: { contentType, cacheControl: "private, max-age=3600" } });
	try {
		await env.DB.prepare("UPDATE characters SET art_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
			.bind(key, characterId).run();
	} catch (error) {
		await env.CHARACTER_ART.delete(key);
		throw error;
	}
	if (character.art_key) await env.CHARACTER_ART.delete(character.art_key);
	return json({ ok: true, artUrl: `/api/characters/${characterId}/art?v=${encodeURIComponent(key)}` });
}

async function getCharacterArt(env: Env, user: AuthUser, characterId: string): Promise<Response> {
	const character = await editableCharacter(env, user, characterId);
	if (!character.art_key) throw new HttpError(404, "Character art not found.");
	const object = await env.CHARACTER_ART.get(character.art_key);
	if (!object) throw new HttpError(404, "Character art not found.");
	const headers = new Headers({ "cache-control": "private, max-age=3600", etag: object.httpEtag });
	object.writeHttpMetadata(headers);
	return new Response(object.body, { headers });
}

async function deleteCharacter(request: Request, env: Env, user: AuthUser, characterId: string): Promise<Response> {
	enforceSameOrigin(request);
	const character = await editableCharacter(env, user, characterId);
	const result = await env.DB.prepare("DELETE FROM characters WHERE id = ?").bind(characterId).run();
	if (!result.meta.changes) throw new HttpError(404, "Character not found.");
	if (character.art_key) {
		try {
			await env.CHARACTER_ART.delete(character.art_key);
		} catch (error) {
			console.error(JSON.stringify({ message: "character deleted but art cleanup failed", characterId, error: error instanceof Error ? error.message : String(error) }));
		}
	}
	return json({ ok: true });
}

async function adjustCharacterHealth(request: Request, env: Env, user: AuthUser, characterId: string): Promise<Response> {
	enforceSameOrigin(request);
	await editableCharacter(env, user, characterId);
	const raw = await readJson(request);
	const delta = integerField(raw, "delta", { min: -1, max: 1 });
	if (delta !== -1 && delta !== 1) throw new HttpError(400, "Health must change by one segment at a time.");
	await env.DB.prepare(
		`UPDATE characters
		 SET health_slots_lost = MAX(0, MIN(10, health_slots_lost + ?)), version = version + 1, updated_at = CURRENT_TIMESTAMP
		 WHERE id = ?`,
	).bind(delta, characterId).run();
	const updated = await env.DB.prepare("SELECT health_slots_lost FROM characters WHERE id = ?")
		.bind(characterId)
		.first<{ health_slots_lost: number }>();
	if (!updated) throw new HttpError(404, "Character not found.");
	return json({ healthSlotsLost: updated.health_slots_lost, dying: updated.health_slots_lost === 10 });
}

async function getRulebook(request: Request, env: Env): Promise<Response> {
	const object = await env.CHARACTER_ART.get(RULEBOOK_KEY, { range: request.headers });
	if (!object) throw new HttpError(404, "The rulebook has not been uploaded yet.");
	const headers = new Headers({
		"accept-ranges": "bytes",
		"cache-control": "private, max-age=3600",
		"content-disposition": 'inline; filename="Dungeon Crawler Carl RPG Rulebook.pdf"',
		"content-type": "application/pdf",
		etag: object.httpEtag,
	});
	object.writeHttpMetadata(headers);
	if (object.range) {
		const suffix = "suffix" in object.range && typeof object.range.suffix === "number" ? object.range.suffix : null;
		const offset = suffix === null && "offset" in object.range ? (object.range.offset ?? 0) : object.size - (suffix ?? object.size);
		const length = suffix ?? ("length" in object.range ? (object.range.length ?? object.size - offset) : object.size - offset);
		headers.set("content-length", String(length));
		headers.set("content-range", `bytes ${offset}-${offset + length - 1}/${object.size}`);
		return new Response(object.body, { status: 206, headers });
	}
	headers.set("content-length", String(object.size));
	return new Response(object.body, { headers });
}

async function handleApi(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	if (request.method === "GET" && url.pathname === "/api/health") {
		return json({ status: "ok", service: "dccrpg" });
	}

	const authResponse = await handleAuthRoute(request, env);
	if (authResponse) return authResponse;
	const user = await requireUser(request, env);
	if (request.method === "GET" && url.pathname === "/api/bootstrap") return bootstrap(env, user);
	if (request.method === "GET" && url.pathname === "/api/rulebook") return getRulebook(request, env);
	if (request.method === "POST" && url.pathname === "/api/campaigns") return createCampaign(request, env, user);
	if (request.method === "POST" && url.pathname === "/api/characters") return createCharacter(request, env, user);
	const characterMatch = url.pathname.match(/^\/api\/characters\/([^/]+)$/);
	if (request.method === "POST" && characterMatch) return updateCharacter(request, env, user, decodeURIComponent(characterMatch[1]));
	if (request.method === "DELETE" && characterMatch) return deleteCharacter(request, env, user, decodeURIComponent(characterMatch[1]));
	const healthMatch = url.pathname.match(/^\/api\/characters\/([^/]+)\/health$/);
	if (request.method === "POST" && healthMatch) return adjustCharacterHealth(request, env, user, decodeURIComponent(healthMatch[1]));
	const artMatch = url.pathname.match(/^\/api\/characters\/([^/]+)\/art$/);
	if (request.method === "POST" && artMatch) return uploadCharacterArt(request, env, user, decodeURIComponent(artMatch[1]));
	if (request.method === "GET" && artMatch) return getCharacterArt(env, user, decodeURIComponent(artMatch[1]));
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
