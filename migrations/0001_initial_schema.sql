PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  floor INTEGER NOT NULL DEFAULT 3 CHECK (floor BETWEEN 1 AND 18),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'complete')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE campaign_members (
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('gm', 'co-gm', 'player', 'observer')),
  joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (campaign_id, user_id)
);

CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  crawler_number INTEGER NOT NULL CHECK (crawler_number > 0),
  race TEXT NOT NULL DEFAULT 'Human',
  class_name TEXT NOT NULL DEFAULT 'Unselected',
  level INTEGER NOT NULL DEFAULT 10 CHECK (level BETWEEN 1 AND 250),
  floor INTEGER NOT NULL DEFAULT 3 CHECK (floor BETWEEN 1 AND 18),
  strength INTEGER NOT NULL DEFAULT 6,
  intelligence INTEGER NOT NULL DEFAULT 5,
  constitution INTEGER NOT NULL DEFAULT 6,
  dexterity INTEGER NOT NULL DEFAULT 5,
  charisma INTEGER NOT NULL DEFAULT 5,
  current_mana INTEGER NOT NULL DEFAULT 5,
  health_slots_lost INTEGER NOT NULL DEFAULT 0 CHECK (health_slots_lost BETWEEN 0 AND 10),
  ai_favor INTEGER NOT NULL DEFAULT 1,
  popularity INTEGER NOT NULL DEFAULT 4,
  size_name TEXT NOT NULL DEFAULT 'Medium',
  size_value INTEGER NOT NULL DEFAULT 4,
  move INTEGER NOT NULL DEFAULT 20,
  step INTEGER NOT NULL DEFAULT 10,
  past_trauma TEXT NOT NULL DEFAULT '',
  loose_end TEXT NOT NULL DEFAULT '',
  regret TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE character_skills (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rank INTEGER NOT NULL DEFAULT 1 CHECK (rank BETWEEN 0 AND 20),
  stat TEXT CHECK (stat IN ('STR', 'INT', 'CON', 'DEX', 'CHA') OR stat IS NULL),
  check_type TEXT NOT NULL DEFAULT 'Unopposed',
  advancement_marked INTEGER NOT NULL DEFAULT 0 CHECK (advancement_marked IN (0, 1)),
  grinding_hours INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  UNIQUE (character_id, name)
);

CREATE TABLE inventory_items (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 0 AND 999),
  location TEXT NOT NULL DEFAULT 'inventory' CHECK (location IN ('inventory', 'hotlist', 'equipped')),
  slot INTEGER,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaigns_owner ON campaigns(owner_id, updated_at DESC);
CREATE INDEX idx_campaign_members_user ON campaign_members(user_id, campaign_id);
CREATE INDEX idx_characters_owner ON characters(owner_id, updated_at DESC);
CREATE INDEX idx_characters_campaign ON characters(campaign_id);
CREATE INDEX idx_character_skills_character ON character_skills(character_id, rank DESC);
CREATE INDEX idx_inventory_character_location ON inventory_items(character_id, location);
