export type User = { id: string; username: string; displayName: string; role: 'admin' | 'player' };

export type AuthStatus = {
  authenticated: boolean;
  setupRequired: boolean;
  user: User | null;
};

export type ManagedUser = {
  id: string;
  username: string;
  display_name: string;
  role: 'admin' | 'player';
  is_active: number;
  created_at: string;
};

export type Campaign = {
  id: string;
  name: string;
  description: string;
  floor: number;
  status: 'active' | 'paused' | 'complete';
  member_count: number;
  character_count: number;
};

export type Skill = {
  id: string;
  character_id: string;
  name: string;
  rank: number;
  stat: 'STR' | 'INT' | 'CON' | 'DEX' | 'CHA' | null;
  check_type: string;
  advancement_marked: number;
};

export type Character = {
  id: string;
  owner_id: string;
  owner_display_name: string;
  owner_username: string | null;
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
  skills: Skill[];
};

export type BootstrapData = {
  user: User;
  campaigns: Campaign[];
  characters: Character[];
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: 'same-origin', ...init });
  const body = await response.json() as { error?: string } & T;
  if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`);
  return body;
}

function postJson<T>(path: string, input: unknown): Promise<T> {
  return requestJson<T>(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function loadAuthStatus(): Promise<AuthStatus> {
  return requestJson<AuthStatus>('/api/auth/status');
}

export function setupAdmin(input: { setupToken: string; username: string; displayName: string; password: string }) {
  return postJson<{ ok: true }>('/api/auth/setup', input);
}

export function login(input: { username: string; password: string }) {
  return postJson<{ ok: true }>('/api/auth/login', input);
}

export function logout() {
  return postJson<{ ok: true }>('/api/auth/logout', {});
}

export function changePassword(input: { currentPassword: string; newPassword: string }) {
  return postJson<{ ok: true }>('/api/auth/password', input);
}

export function listManagedUsers() {
  return requestJson<{ users: ManagedUser[] }>('/api/admin/users');
}

export function createManagedUser(input: { username: string; displayName: string; password: string }) {
  return postJson<{ id: string }>('/api/admin/users', input);
}

export function resetManagedUserPassword(userId: string, password: string) {
  return postJson<{ ok: true; signedOut: boolean }>(`/api/admin/users/${encodeURIComponent(userId)}/password`, { password });
}

export function setManagedUserActive(userId: string, active: boolean) {
  return postJson<{ ok: true }>(`/api/admin/users/${encodeURIComponent(userId)}/active`, { active });
}

export function loadBootstrap(): Promise<BootstrapData> {
  return requestJson<BootstrapData>('/api/bootstrap');
}

export function createCampaign(input: { name: string; description: string; floor: number }) {
  return postJson<{ id: string }>('/api/campaigns', input);
}

export function createCharacter(input: {
  name: string;
  crawlerNumber: number;
  race: string;
  className: string;
  campaignId: string | null;
  skillNames: string[];
  level: 10 | 20 | 30;
  statMethod: 'standard' | 'manual';
  rolledValues: number[];
  baseStats: Record<'strength' | 'intelligence' | 'constitution' | 'dexterity' | 'charisma', number>;
  levelStatPoints: Record<'strength' | 'intelligence' | 'constitution' | 'dexterity' | 'charisma', number>;
  raceFlexibleStats: Record<'strength' | 'intelligence' | 'constitution' | 'dexterity' | 'charisma', number>;
  classFlexibleStats: Record<'strength' | 'intelligence' | 'constitution' | 'dexterity' | 'charisma', number>;
}) {
  return postJson<{ id: string }>('/api/characters', input);
}

export type CharacterUpdate = {
  name: string;
  crawlerNumber: number;
  race: string;
  className: string;
  genderPronouns: string;
  level: number;
  floor: number;
  strength: number;
  intelligence: number;
  constitution: number;
  dexterity: number;
  charisma: number;
  aiFavor: number;
  popularity: number;
  sizeName: string;
  sizeValue: number;
  move: number;
  step: number;
  currentMana: number;
  healthSlotsLost: number;
  pastTrauma: string;
  looseEnd: string;
  regret: string;
  notes: string;
  sheetData: CharacterSheetData;
};

export type SheetRow = Record<string, string | number | boolean>;

export type CharacterSheetData = {
  armor: number;
  armorBuffs: number;
  evadeBuffs: number;
  externalBuffs: string[];
  debuffs: string;
  unenhancedStats: Record<string, number>;
  attacks: SheetRow[];
  hotlist: SheetRow[];
  gear: Record<string, string>;
  skills: SheetRow[];
  inventory: SheetRow[];
};

export const emptyCharacterSheetData: CharacterSheetData = {
  armor: 0,
  armorBuffs: 0,
  evadeBuffs: 0,
  externalBuffs: ['', '', ''],
  debuffs: '',
  unenhancedStats: { strength: 6, intelligence: 5, constitution: 6, dexterity: 5, charisma: 5 },
  attacks: Array.from({ length: 10 }, () => ({ name: '', rank: 0, toHitStat: '', toHitMod: '', dice: '', damageStat: '', damageMod: '', effects: '' })),
  hotlist: Array.from({ length: 10 }, () => ({ entry: '' })),
  gear: { head: '', torso: '', arms: '', hands: '', legs: '', feet: '', accessories: '' },
  skills: Array.from({ length: 18 }, () => ({ name: '', rank: 0, statMod: '', checkType: '', notes: '', advanced: false })),
  inventory: Array.from({ length: 18 }, () => ({ item: '', quantity: 1, notes: '' })),
};

export function parseCharacterSheetData(value: string): CharacterSheetData {
  try {
    const parsed = JSON.parse(value) as Partial<CharacterSheetData>;
    return {
      ...emptyCharacterSheetData,
      ...parsed,
      gear: { ...emptyCharacterSheetData.gear, ...parsed.gear },
      unenhancedStats: { ...emptyCharacterSheetData.unenhancedStats, ...parsed.unenhancedStats },
    };
  } catch {
    return { ...emptyCharacterSheetData };
  }
}

export function updateCharacter(characterId: string, input: CharacterUpdate) {
  return postJson<{ ok: true }>(`/api/characters/${encodeURIComponent(characterId)}`, input);
}

export function deleteCharacter(characterId: string) {
  return requestJson<{ ok: true }>(`/api/characters/${encodeURIComponent(characterId)}`, { method: 'DELETE' });
}

export function adjustCharacterHealth(characterId: string, delta: -1 | 1) {
  return postJson<{ healthSlotsLost: number; dying: boolean }>(`/api/characters/${encodeURIComponent(characterId)}/health`, { delta });
}

export async function uploadCharacterArt(characterId: string, file: File) {
  const response = await fetch(`/api/characters/${encodeURIComponent(characterId)}/art`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': file.type },
    body: file,
  });
  const body = await response.json() as { error?: string; artUrl?: string };
  if (!response.ok) throw new Error(body.error ?? `Upload failed (${response.status})`);
  return body;
}
