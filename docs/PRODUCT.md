# Product specification

## Product goal

Give a private tabletop group a fast digital equivalent of a premium character-and-campaign manager without copying another product's branding or visual design. The interface should automate arithmetic and bookkeeping while keeping the Game Master in control of rulings.

## MVP scope

### Accounts and access

- App-managed username/password accounts with administrator-created player access.
- Players can change their own password; the owner can reset or disable accounts.
- The owner can see and edit every crawler; players are restricted to their own.

### Character creation

- Level 1 Tutorial Floor creation and accelerated Level 10/20/30 entry.
- Human or animal background paths.
- Background skill selection and duplicate prevention.
- Standard-array or rolled starting Stats.
- Weapon, attack Spell, or hand-to-hand choice.
- Derived Evade, Health Bar, Mana, Move, Step, size, AI Favor, and Popularity.
- Past Trauma, Loose End, Regret, starting gear, Tutorial Floor experiences, and acquired loot.
- Race/Class prerequisites, benefits, drawbacks, recommendations, and custom point builds.

### Character sheet

- Enhanced and unenhanced Stats with calculated modifiers.
- Ten-slot Health Bar, Mana, Evade, damage resistance, Buffs, and Debuffs.
- Skills with rank, governing Stat, check type, usage mark, and grinding hours.
- Attacks, Spells, ten-slot Hotlist, inventory, gear, tattoos, and patches.
- Floor, level, crawler number, AI Favor, Popularity, and advancement tracking.

### Campaigns

- Create campaigns and invite players.
- Assign characters and party membership.
- Track current floor, quests, NPCs, session notes, and shared assets.
- GM visibility controls for hidden notes and upcoming content.

### Compendium

- Structured mechanics for lookup and automation.
- Concise summaries and source-page references.
- No wholesale reproduction of rulebook prose or artwork without permission.

## Delivery phases

1. **Foundation** — repository, Worker, D1, private identity, dashboard, initial CRUD. *(current)*
2. **Character builder** — guided Level 10/20/30 identity, Race, Class, Stat, and Skill selection is live, including automatic Stat modifiers, Mana, and Popularity; backgrounds, experiences, starting loot, and complete prerequisite automation remain.
3. **Playable sheet** — live Health, Mana, attacks, Hotlist, conditions, skills, editable sheets, artwork, character deletion, and an advantage/disadvantage dice roller.
4. **Campaign play** — invitations, roles, party view, notes, quests, and GM tools.
5. **Rules data** — reviewed, versioned skills, spells, races, classes, gear, and page references.
6. **Polish** — accessibility, mobile play mode, audit history, backups, and production hardening.

## Data principles

- Store rules as versioned structured data rather than embedding calculations in UI components.
- Store uploaded binary assets in R2; D1 stores metadata and object keys only.
- Keep rulebook-derived text short and functional, with a source-page field for verification.
- Use optimistic concurrency (`version`) when character editing is added.
- Keep all campaign and character queries scoped to the authenticated user or campaign membership.

## Explicitly deferred

- Public self-service registration and billing
- Real-time multi-user character editing
- Dice-room WebSockets
- Marketplace or public homebrew sharing
- Full-text reproduction of the supplied sourcebook
