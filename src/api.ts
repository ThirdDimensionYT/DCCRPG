export type User = { id: string; email: string; displayName: string };

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
  skills: Skill[];
};

export type BootstrapData = {
  user: User;
  campaigns: Campaign[];
  characters: Character[];
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const body = await response.json() as { error?: string } & T;
  if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`);
  return body;
}

export function loadBootstrap(): Promise<BootstrapData> {
  return requestJson<BootstrapData>('/api/bootstrap');
}

export function createCampaign(input: { name: string; description: string; floor: number }) {
  return requestJson<{ id: string }>('/api/campaigns', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function createCharacter(input: {
  name: string;
  crawlerNumber: number;
  race: string;
  className: string;
  campaignId: string | null;
}) {
  return requestJson<{ id: string }>('/api/characters', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
}
