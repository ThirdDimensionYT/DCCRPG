export type RuleOption = { name: string; group: string; summary: string; page: number; requirement?: string }

const race = (name: string, page: number, summary: string, requirement?: string): RuleOption => ({ name, group: page >= 139 ? 'Alien races' : 'Earth-based races', summary, page, requirement })

export const RACES: RuleOption[] = [
  race('Amazonian',129,'A powerful athletic humanoid suited to martial classes and physical endurance.','A Strength- or Dexterity-based skill at Rank 5+.'),
  race('Arachnid',129,'A many-legged climber with web magic, keen perception, and a creative streak.'),
  race('Cat',130,'A small, agile animal crawler with exceptional reflexes, luck, and night vision.','The crawler must already be a cat.'),
  race('Cat Girl/Cat Boy',130,'A charismatic feline humanoid who blends agility, charm, and claw attacks.'),
  race('Changbi Demon',130,'An undead chain-wielding hunter built for ambushes and close combat.'),
  race('Changeling',131,'A social infiltrator who collects forms and borrows abilities from other races.'),
  race('Crocodilian',131,'A heavily protected reptilian bruiser who thrives on food and intimidation.'),
  race('Doppelgänger',131,'A deceptive shapeshifter who copies appearances while retaining their own abilities.'),
  race('Dwarf, Classic',132,'A sturdy traditional dwarf with practical toughness and crafting aptitude.'),
  race('Dwarf, Fathom',132,'A subterranean dwarf adapted to darkness, hard environments, and dungeon survival.'),
  race('Elf, High',133,'An elegant, magically inclined elf suited to arcane and social roles.'),
  race('Elf, City',133,'An adaptable urban elf with social awareness and streetwise talents.'),
  race('Elf, Night',134,'A stealth-focused nocturnal elf who excels in darkness and surprise.'),
  race('Frost Maiden',134,'A cold-aligned humanoid with icy magic and resilience in frozen environments.'),
  race('Human',135,'A versatile Earth crawler whose adaptability supports almost any class.'),
  race('Igneous',135,'A stone-and-fire themed race built for resilience and force.'),
  race('Obsidian Butterfly',136,'A dramatic winged race combining mobility, beauty, and dangerous edges.'),
  race('Lajabless',136,'A supernatural Earth race with unusual social and magical gifts.'),
  race('Primal',137,'A mysterious high-risk option with enormous long-term skill potential.','Discuss this unusual option with the GM.'),
  race('Rat Hooligan',137,'A small survivor who excels at stealth, escape, scavenging, and biting.'),
  race('Sasquatch',137,'A huge, powerful melee specialist built to absorb punishment and smush foes.','Smush at Rank 5+.'),
  race('Tetrakai',138,'A four-armed combatant able to hold and manage more equipment at once.'),
  race('Tigran',138,'A swift tiger humanoid who specializes in ambushes and ferocious melee attacks.'),
  race('Bune',139,'A clever draconic Syndicate race with crafting, negotiation, and developing wings.','Popularity 3+.'),
  race('Caprid',139,'A highly intelligent and charismatic goat-like Syndicate race built to lead.'),
  race('Grulke',139,'A martial toad humanoid with powerful jumps, reach attacks, and a long tongue.','Jumping or Light on Your Feet at Rank 5+.'),
  race('Hobgoblin',140,'An explosive and trap-focused survivor with strong regeneration.','Explosives Handling at Rank 5+ and any trap-based skill.'),
  race('Pocket Kuma',140,'A tiny, adorable animal crawler with outstanding agility and social appeal.'),
  race('Pterolykos',141,'A winged wolf humanoid with strong performance, tracking, and short flight.'),
  race('Skyfowl',141,'A proud avian warrior with flight, sharp perception, and strong social skills.'),
]

const cls = (name: string, group: string, page: number, summary: string, requirement?: string): RuleOption => ({ name, group, page, summary, requirement })
export const CLASSES: RuleOption[] = [
  cls('Boring Ol’ Arcanist','Arcanist',142,'A versatile magical crafter who works across several arcane disciplines.'),
  cls('Alchemist','Arcanist',142,'A potion and poison specialist with strong alchemy and infusion abilities.'),
  cls('Douchy Wizard School Wand-Maker','Arcanist',142,'A focused maker of wands, staves, and magical implements.'),
  cls('Infernocrafter','Arcanist',143,'A fire-resistant smith who creates flame-powered arcane gear.'),
  cls('Prison Tattoo Artist','Arcanist',143,'A magical tattoo crafter who turns rough artwork into enhancements.'),
  cls('Boring Ol’ Barbarian','Barbarian',144,'A straightforward rage-fuelled frontline warrior.'),
  cls('Gladiator','Barbarian',144,'A theatrical arena combatant who mixes violence with crowd appeal.'),
  cls('Harii','Barbarian',144,'A relentless warrior drawing power from ancient battle fury.'),
  cls('Feral Cat Berserker','Barbarian',144,'A feline berserker built for fast, savage close combat.','A cat-based race such as Cat, Cat Girl/Cat Boy, or Tigran.'),
  cls('Shieldmaiden','Barbarian',144,'A protective warrior combining aggression with shield defence.','Limited to female crawlers unless the GM waives the setting restriction.'),
  cls('Boring Ol’ Bard','Bard',145,'A flexible performer who supports allies through personality and talent.'),
  cls('Artist Alley Mogul','Bard',145,'A creative entrepreneur who turns art, influence, and commerce into power.'),
  cls('Former Child Actor','Bard',145,'A practiced performer weaponizing charm, recognition, and resilience.','Popularity 3+ and the Cut! achievement.'),
  cls('NecroBard','Bard',146,'A macabre performer blending showmanship with death-themed magic.'),
  cls('Poet Laureate','Bard',146,'A wordsmith whose performance and language shape social encounters.'),
  cls('Professional Roadie','Bard',146,'A durable support specialist used to gear, chaos, and keeping the show moving.'),
  cls('Spellbinder','Bard',147,'A charismatic magical performer who controls a scene through spells.'),
  cls('Boring Ol’ Cleric','Cleric',148,'A traditional divine caster who heals, protects, and channels faith.'),
  cls('Black Inquisitor General','Cleric',148,'An intimidating divine authority focused on judgment and control.'),
  cls('Santero','Cleric',148,'A spiritual practitioner who works through ritual, spirits, and healing.'),
  cls('Boring Ol’ Druid','Druid',148,'A nature caster with balanced survival, healing, and elemental magic.'),
  cls('Herbalist','Druid',149,'A plant-wise survivalist who crafts remedies and draws strength from nature.'),
  cls('Lifebringer','Druid',149,'A restorative nature caster focused on sustaining life and allies.'),
  cls('Physicker','Druid',149,'A practical healer combining medicine, survival, and restorative magic.'),
  cls('Shepherd','Druid',150,'A protective keeper who supports a chosen flock of allies, pets, or mounts.'),
  cls('Boring Ol’ Fighter','Fighter',150,'A dependable weapon specialist with broad martial flexibility.'),
  cls('Pit Fighter','Fighter',150,'A hard-wearing close-combat specialist shaped by brutal arena fights.'),
  cls('Shotgun Messenger','Fighter',150,'A mobile ranged combatant delivering messages and buckshot with equal force.'),
  cls('Straight-to-DVD Action Hero','Fighter',151,'A stunt-hardened all-round action fighter with cinematic flair.'),
  cls('Sword and Boarder','Fighter',151,'A classic weapon-and-shield defender built for the front line.'),
  cls('Monster Truck Driver','Fighter',152,'A high-speed tank who turns vehicles and momentum into defence.','Driving at Rank 5+.'),
  cls('Zulu Warrior','Fighter',152,'A disciplined martial hunter skilled with traditional weapons and movement.'),
  cls('Boring Ol’ Mage','Mage',152,'A general arcane caster with flexible spell choices.'),
  cls('Blizzardmancer','Mage',153,'A water-and-ice caster who freezes enemies and controls space.'),
  cls('Crisper','Mage',153,'A fire caster who burns enemies and thrives in intense heat.'),
  cls('Fire Spiritualist','Mage',153,'A mystical flame wielder combining spiritual insight with destructive magic.'),
  cls('Forsaken Aerialist','Mage',153,'An agile magical performer using movement and altitude to survive.'),
  cls('Necromancer','Mage',154,'A life-force manipulator who drains the living and commands the dead.'),
  cls('Boring Ol’ Monk','Monk',154,'A disciplined hand-to-hand fighter with balanced physical talents.'),
  cls('Elemental Monk','Monk',154,'A martial artist channeling elemental effects through close combat.'),
  cls('Prizefighter','Monk',154,'A pugilist rewarded for bare-knuckle victories.','Pugilism at Rank 5+.'),
  cls('Spirit Healer','Monk',155,'A pressure-point healer who can restore allies or hurt enemies.'),
  cls('Street Monk','Monk',155,'A practical urban martial artist shaped by improvised fights and survival.'),
  cls('Boring Ol’ Paladin','Paladin',155,'A traditional armoured champion combining martial and divine power.'),
  cls('Cavalier','Paladin',156,'A mounted protector driven by a personal code and spectacular charges.'),
  cls('Sacred Paladin','Paladin',156,'A devoted holy warrior focused on protection and smiting enemies.'),
  cls('Boring Ol’ Rogue','Rogue',156,'A versatile stealth and trickery specialist.'),
  cls('Bomb Squad Tech','Rogue',156,'An explosives expert trained to survive traps, blasts, and lost limbs.','The Boom! achievement.'),
  cls('Compensated Anarchist','Rogue',157,'A trapmaking provocateur blending explosives with social disruption.','Popularity 3+ and Explosives Handling at Rank 5+.'),
  cls('High Rise Grifter','Rogue',157,'A social infiltrator who excels at deception, access, and urban schemes.'),
  cls('Identity Thief','Rogue',157,'A specialist in impersonation, stolen identities, and social infiltration.'),
  cls('Swashbuckler','Rogue',158,'A flamboyant swordfighter combining agility, charm, and daring.'),
]

const attackSkills = [
  ['Back Claw',177],['Bite',177],['Slice Attack',177],['Club',178],['Improvised Weapons',178],['Warhammer',178],['Axe',178],['Dagger',178],['Longsword',178],['Rapier',178],['Foot Soldier',179],['Noggin Nocker',179],['Pugilism',179],['Unarmed Combat',179],['Wrasslin’',179],['Choke Out',180],['Dirty Fighting',180],['Iron Punch',180],['Powerful Strike',180],['Skullcracker',180],['Smush',181],['Toss',181],['Bow',181],['Crossbow',181],['Handgun',181],['Javelin',182],['Shotgun',182],['Shuriken',182],['Slingshot',182],['Herding Weapons',182],['Lance',182],['Polearm',183],['Quarterstaff',183],
] as const
const utilitySkills = [
  ['Acute Ears',184],['Aiming',184],['Alchemy',184],['Ambush',184],['Animal Handling',185],['Arcane',185],['Attack of Opportunity',185],['Backfire',185],['Balance',186],['Basic Science',186],['Bomb Surgeon',186],['Calligraphy',186],['Cartography',186],['Cat-like Reflexes',186],['Catcher',187],['Cesta Punta',187],['Character Actor',187],['Chopper Pilot',187],['Climbing',188],['Cockroach',188],['Cooking',188],['Deception',189],['Detect Lies',189],['Detect Trap',189],['Determine Value',189],['Diplomacy',189],['Dodge',190],['Double Tap',190],['Driving',190],['Dumpster Diving',190],['Endurance',190],['Engineering',191],['Escape Artist',191],['Escape Plan',191],['Explosives Handling',191],['Fabricate',191],['Find Crawler',192],['Find Trap',192],['First Aid',192],['Gear Head',192],['Goblin Explosives',192],['Good First Impression',193],['Hide in Shadows',193],['Improvised Explosive Device',193],['Incendiary Device Handling',193],['Infusion',194],['Intimidate',194],['Investigation',194],['Iron Stomach',194],['Jumping',194],['Leadership',194],['Light on Your Feet',195],['Lockpicking',195],['Lore',195],['Negotiation',195],['Pathfinder',195],['Perception',196],['Performance',196],['Persuasion',196],['Regeneration',196],['Religion',197],['Repair',197],['Riding',197],['Ropework',197],['Running',197],['Salvage',198],['Scutelliphily',198],['Shield Block',198],['Sleight of Hand',198],['Smithing',199],['Stealth',199],['Streetwise',199],['Survival',199],['Swimming',199],['Tactics',200],['Tattoo Artistry',200],['Taunt',200],['Throwing',200],['Tracking',201],['Trap Engineer',201],['Zone of Control',201],
] as const

export const SKILLS: RuleOption[] = [
  ...attackSkills.map(([name,page]) => ({ name, page, group: 'Attack skills', summary: `An attack skill for fighting with ${name.toLowerCase()}.` })),
  ...utilitySkills.map(([name,page]) => ({ name, page, group: 'Utility skills', summary: `A utility skill for ${name.toLowerCase()} checks and related dungeon situations.` })),
]
export const RACE_NAMES = new Set(RACES.map(({ name }) => name))
export const CLASS_NAMES = new Set(CLASSES.map(({ name }) => name))
export const SKILL_NAMES = new Set(SKILLS.map(({ name }) => name))

export const STAT_KEYS = ['strength', 'intelligence', 'constitution', 'dexterity', 'charisma'] as const
export type StatKey = typeof STAT_KEYS[number]
export type StatBlock = Record<StatKey, number>
export const STAT_ABBREVIATIONS: Record<StatKey, string> = { strength: 'STR', intelligence: 'INT', constitution: 'CON', dexterity: 'DEX', charisma: 'CHA' }
export type FlexibleStatBonus = { points: number; stats: StatKey[]; allToOne?: boolean; label: string }
export type StatRule = { fixed?: Partial<StatBlock>; flexible?: FlexibleStatBonus; caps?: Partial<StatBlock> }

const statRule = (fixed: Partial<StatBlock> = {}, flexible?: FlexibleStatBonus, caps?: Partial<StatBlock>): StatRule => ({ fixed, flexible, caps })
export const OPTION_STAT_RULES: Record<string, StatRule> = {
  Amazonian: statRule({ strength: 6, dexterity: 3 }),
  Arachnid: statRule({ dexterity: 5 }),
  Cat: statRule({ dexterity: 4, constitution: 2, charisma: 1, strength: -3 }),
  'Cat Girl/Cat Boy': statRule({ dexterity: 3, charisma: 3, constitution: -2 }),
  'Changbi Demon': statRule({ dexterity: 5, strength: 3, constitution: 3, charisma: -2 }),
  Changeling: statRule({ charisma: 3, intelligence: 2 }),
  Crocodilian: statRule({ strength: 4, constitution: 3 }),
  Doppelgänger: statRule({ constitution: 4, strength: 3 }),
  'Dwarf, Classic': statRule({ constitution: 4, intelligence: 2, charisma: -2 }),
  'Dwarf, Fathom': statRule({ constitution: 3, strength: 2 }),
  'Elf, High': statRule({ intelligence: 4, dexterity: 4, charisma: 4 }),
  'Elf, City': statRule({}, { points: 6, stats: ['intelligence', 'dexterity', 'charisma'], label: 'City Elf racial points' }),
  'Elf, Night': statRule({ intelligence: 3, dexterity: 3 }),
  'Frost Maiden': statRule({ charisma: 2, intelligence: 2, dexterity: 2 }),
  Igneous: statRule({ constitution: 6, strength: 4, intelligence: -2, charisma: -2 }),
  'Obsidian Butterfly': statRule({ dexterity: 3, intelligence: 2, constitution: -4 }),
  Lajabless: statRule({}, { points: 5, stats: ['strength', 'intelligence'], allToOne: true, label: 'Lajabless current day/night bonus' }),
  Primal: statRule({ strength: 2, intelligence: 2, constitution: 2, dexterity: 2, charisma: 2 }),
  'Rat Hooligan': statRule({ dexterity: 2, constitution: 1 }),
  Sasquatch: statRule({ strength: 6, constitution: 6, dexterity: 2, intelligence: -3, charisma: -1 }),
  Tetrakai: statRule({ dexterity: 6, charisma: -2 }),
  Tigran: statRule({ dexterity: 3, strength: 2, charisma: -4 }),
  Bune: statRule({ intelligence: 3, dexterity: 2, constitution: -2 }),
  Caprid: statRule({ intelligence: 3, charisma: 3, strength: -2 }),
  Grulke: statRule({ dexterity: 3, strength: 2, charisma: -2 }),
  Hobgoblin: statRule({ dexterity: 1, charisma: -5 }, undefined, { charisma: 10 }),
  'Pocket Kuma': statRule({ dexterity: 5, charisma: 5, strength: -4, constitution: -4 }, undefined, { strength: 10 }),
  Pterolykos: statRule({ charisma: 4, dexterity: 2 }),
  Skyfowl: statRule({ dexterity: 3, charisma: 3, strength: -1, constitution: -1 }),
  'Boring Ol’ Arcanist': statRule({ intelligence: 3, dexterity: 2 }),
  Alchemist: statRule({ constitution: 3, intelligence: 3 }),
  'Douchy Wizard School Wand-Maker': statRule({ intelligence: 5, strength: 1, dexterity: 1, charisma: -2 }),
  Infernocrafter: statRule({ strength: 3, constitution: 3, dexterity: 1 }),
  'Prison Tattoo Artist': statRule({ constitution: 3, dexterity: 3, intelligence: 2 }),
  'Boring Ol’ Barbarian': statRule({ strength: 6, constitution: 5 }),
  Gladiator: statRule({ strength: 3, constitution: 3, charisma: 3 }),
  Harii: statRule({ strength: 1, dexterity: 1, intelligence: 1 }),
  'Feral Cat Berserker': statRule({ dexterity: 2, strength: 2, charisma: 2 }),
  Shieldmaiden: statRule({ strength: 3, dexterity: 3, charisma: 3, intelligence: -2 }),
  'Boring Ol’ Bard': statRule({ charisma: 3 }),
  'Artist Alley Mogul': statRule({ dexterity: 5, charisma: 5 }),
  'Former Child Actor': statRule({ charisma: 10 }),
  NecroBard: statRule({ intelligence: 3, constitution: 3, charisma: 3, strength: -2 }),
  'Poet Laureate': statRule({ intelligence: 3, charisma: 2 }),
  'Professional Roadie': statRule({}, { points: 8, stats: ['strength', 'constitution', 'charisma'], label: 'Professional Roadie class points' }),
  Spellbinder: statRule({ charisma: 2, intelligence: 2 }),
  'Boring Ol’ Cleric': statRule({ charisma: 4, intelligence: 3 }),
  'Black Inquisitor General': statRule({ strength: 3, intelligence: 3, charisma: 1, constitution: -2 }),
  Santero: statRule({ strength: 3, charisma: 3, constitution: 2, intelligence: -2 }),
  'Boring Ol’ Druid': statRule({ intelligence: 2, constitution: 2, dexterity: 2 }),
  Herbalist: statRule({ constitution: 2, intelligence: 2 }),
  Lifebringer: statRule({ constitution: 2, intelligence: 1 }),
  Physicker: statRule({ constitution: 3, intelligence: 3 }),
  Shepherd: statRule({ intelligence: 2, charisma: 2, constitution: 2 }),
  'Boring Ol’ Fighter': statRule({ strength: 2, constitution: 2 }),
  'Pit Fighter': statRule({ dexterity: 3, intelligence: 2, strength: 1 }),
  'Shotgun Messenger': statRule({ strength: 2, constitution: 2, dexterity: 2, charisma: -2 }),
  'Straight-to-DVD Action Hero': statRule({ strength: 3, constitution: 3, dexterity: 3, charisma: 3, intelligence: -2 }),
  'Sword and Boarder': statRule({ strength: 2, constitution: 2, dexterity: 2, intelligence: -2 }),
  'Monster Truck Driver': statRule({ constitution: 4, dexterity: 2, strength: -2, intelligence: -2 }),
  'Zulu Warrior': statRule({ strength: 3, constitution: 3, dexterity: 3 }),
  'Boring Ol’ Mage': statRule({ intelligence: 5, charisma: 5, strength: -2, dexterity: -2 }),
  Blizzardmancer: statRule({ intelligence: 4, dexterity: 3, strength: -2 }),
  Crisper: statRule({ intelligence: 3, dexterity: 2, constitution: -2 }),
  'Fire Spiritualist': statRule({ intelligence: 2, charisma: 2 }),
  'Forsaken Aerialist': statRule({ intelligence: 5, charisma: -2 }),
  Necromancer: statRule({ intelligence: 2, dexterity: 2, constitution: -2, charisma: -2 }),
  'Boring Ol’ Monk': statRule({ constitution: 3, dexterity: 3, strength: 1 }),
  'Elemental Monk': statRule({ intelligence: 2, dexterity: 2 }),
  Prizefighter: statRule({ constitution: 5, strength: 2, intelligence: -2, charisma: -2 }),
  'Spirit Healer': statRule({ strength: 3, constitution: 3, dexterity: 1 }),
  'Street Monk': statRule({ dexterity: 2, strength: 1, charisma: 1 }),
  'Boring Ol’ Paladin': statRule({ charisma: 3 }),
  Cavalier: statRule({ strength: 2, constitution: 2 }),
  'Sacred Paladin': statRule({ strength: 3, charisma: 2 }),
  'Boring Ol’ Rogue': statRule({ intelligence: 1, dexterity: 1, charisma: 1 }),
  'Bomb Squad Tech': statRule({ dexterity: 2, constitution: 1, intelligence: -2 }),
  'Compensated Anarchist': statRule({ charisma: 5, intelligence: 1 }),
  'High Rise Grifter': statRule({ intelligence: 1, charisma: 1 }),
  'Identity Thief': statRule({ charisma: 4, dexterity: 3 }),
  Swashbuckler: statRule({ dexterity: 3, charisma: 3 }),
}

export type LevelOption = { level: 10 | 20 | 30; floor: 3 | 4 | 5; statPoints: 27 | 57 | 87; label: string; summary: string; minimumSkills: number }
export const LEVEL_OPTIONS: LevelOption[] = [
  { level: 10, floor: 3, statPoints: 27, minimumSkills: 3, label: 'Level 10 · Third Floor', summary: 'Third Floor package: 27 level-up Stat points, six Tutorial Floor experiences, acquired loot, and Race/Class selection.' },
  { level: 20, floor: 4, statPoints: 57, minimumSkills: 6, label: 'Level 20 · Fourth Floor', summary: 'Fourth Floor package: 57 total level-up Stat points, two additional experience rolls, six Skill improvements, and extra Bronze/Silver loot.' },
  { level: 30, floor: 5, statPoints: 87, minimumSkills: 8, label: 'Level 30 · Fifth Floor', summary: 'Fifth Floor package: 87 total level-up Stat points, four additional experience rolls, eight Skill improvements, and extra Gold/Platinum loot.' },
]

export const emptyStatBlock = (): StatBlock => ({ strength: 0, intelligence: 0, constitution: 0, dexterity: 0, charisma: 0 })

export type ProgressionUnlock = { id: string; source: string; level: number; name: string; summary: string; page: number }
export type AutomaticLevelEffects = { statBonuses: StatBlock; aiFavor: number; unlocks: ProgressionUnlock[] }

export function levelStatPoints(floor: number, levelsGained: number): number {
  return floor <= 3 ? levelsGained * 3 : 0
}

export function automaticLevelEffects(raceName: string, currentLevel: number, targetLevel: number): AutomaticLevelEffects {
  const effects: AutomaticLevelEffects = { statBonuses: emptyStatBlock(), aiFavor: 0, unlocks: [] }
  if (raceName === 'Primal') effects.aiFavor = Math.max(0, targetLevel - currentLevel)
  if (raceName === 'Bune' && currentLevel < 50 && targetLevel >= 50) {
    effects.statBonuses.dexterity = 2
    effects.unlocks.push({ id: 'bune-wings', source: 'Bune Race', level: 50, name: 'Strengthened Wings', summary: '+2 Dexterity and flight up to 500 feet per scene.', page: 139 })
  }
  return effects
}

export function statRuleSummary(name: string): string {
  const rule = OPTION_STAT_RULES[name]
  if (!rule) return 'No fixed Stat changes.'
  const parts = STAT_KEYS.flatMap((key) => rule.fixed?.[key] ? [`${rule.fixed[key]! > 0 ? '+' : ''}${rule.fixed[key]} ${STAT_ABBREVIATIONS[key]}`] : [])
  if (rule.flexible) parts.push(`+${rule.flexible.points} allocated ${rule.flexible.allToOne ? 'to one of' : 'between'} ${rule.flexible.stats.map((key) => STAT_ABBREVIATIONS[key]).join('/')}`)
  if (rule.caps) parts.push(...STAT_KEYS.flatMap((key) => rule.caps?.[key] ? [`${STAT_ABBREVIATIONS[key]} cap ${rule.caps[key]}`] : []))
  return parts.join(' · ') || 'No fixed Stat changes.'
}

export function calculateStats(base: StatBlock, levelPoints: StatBlock, raceName: string, className: string, raceFlexible: StatBlock, classFlexible: StatBlock): StatBlock {
  const raceRule = OPTION_STAT_RULES[raceName] ?? {}
  const classRule = OPTION_STAT_RULES[className] ?? {}
  return Object.fromEntries(STAT_KEYS.map((key) => {
    const raw = base[key] + levelPoints[key] + (raceRule.fixed?.[key] ?? 0) + (classRule.fixed?.[key] ?? 0) + raceFlexible[key] + classFlexible[key]
    const cap = Math.min(raceRule.caps?.[key] ?? Number.POSITIVE_INFINITY, classRule.caps?.[key] ?? Number.POSITIVE_INFINITY)
    return [key, Math.max(1, Math.min(raw, cap))]
  })) as StatBlock
}
