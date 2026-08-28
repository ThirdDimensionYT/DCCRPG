export type CombatStat = 'STR' | 'INT' | 'CON' | 'DEX' | 'CHA'

export type AttackProfile = {
  toHitStat: CombatStat
  damageStat?: CombatStat
  baseDice?: number
  dieSides?: number
  upgradeDice?: [number, number, number]
  damageType?: string
  range: string
  effect?: string
  rank15Multiplier?: number
}

export type SpellCatalogEntry = {
  id: string
  name: string
  page: number
  category: string
  manaCost: number | null
  summary: string
  attack?: AttackProfile
}

export type InventoryCatalogEntry = {
  id: string
  name: string
  page: number
  category: 'Weapon' | 'Consumable' | 'Adventuring gear' | 'Explosive'
  summary: string
  attack?: AttackProfile
}

const attack = (
  toHitStat: CombatStat,
  damageStat: CombatStat | undefined,
  baseDice: number | undefined,
  dieSides: number | undefined,
  damageType: string | undefined,
  range: string,
  upgradeDice: [number, number, number] = [1, 1, 1],
  effect?: string,
): AttackProfile => ({ toHitStat, damageStat, baseDice, dieSides, damageType, range, upgradeDice, effect })

export const WEAPON_CATALOG: InventoryCatalogEntry[] = [
  { id:'club',name:'Club',page:178,category:'Weapon',summary:'One-handed bashing weapon.',attack:attack('STR','STR',1,6,'Bludgeoning','Melee') },
  { id:'improvised-weapons',name:'Improvised Weapon',page:178,category:'Weapon',summary:'A suitable object weighing between one pound and your STR in pounds.',attack:attack('STR','STR',1,4,'Bludgeoning','Melee') },
  { id:'warhammer',name:'Warhammer',page:178,category:'Weapon',summary:'Heavy two-handed bashing weapon.',attack:attack('STR','STR',1,10,'Bludgeoning','Melee') },
  { id:'axe',name:'Axe',page:178,category:'Weapon',summary:'Edged melee weapon with sweeping upgrades.',attack:attack('STR','STR',1,6,'Slashing','Melee') },
  { id:'dagger',name:'Dagger',page:178,category:'Weapon',summary:'Agile edged weapon that can later pierce armor and be thrown.',attack:attack('DEX','STR',1,4,'Piercing','Melee') },
  { id:'longsword',name:'Longsword',page:178,category:'Weapon',summary:'Reliable Strength-based edged weapon.',attack:attack('STR','STR',1,8,'Slashing','Melee') },
  { id:'rapier',name:'Rapier',page:178,category:'Weapon',summary:'Agile fencing weapon using Dexterity for accuracy and damage.',attack:attack('DEX','DEX',1,6,'Piercing','Melee') },
  { id:'bow',name:'Bow',page:181,category:'Weapon',summary:'Two-handed ranged weapon requiring ammunition.',attack:attack('DEX','STR',1,6,'Piercing','100 feet') },
  { id:'crossbow',name:'Crossbow',page:181,category:'Weapon',summary:'Two-handed ranged weapon with a once-per-round cooldown.',attack:attack('DEX',undefined,1,8,'Piercing','50 feet') },
  { id:'handgun',name:'Handgun',page:181,category:'Weapon',summary:'Long-range firearm requiring ammunition.',attack:attack('DEX',undefined,1,8,'Piercing','150 feet') },
  { id:'javelin',name:'Javelin',page:182,category:'Weapon',summary:'Thrown ranged weapon that adds Strength to damage.',attack:attack('DEX','STR',1,8,'Piercing','40 feet') },
  { id:'shotgun',name:'Shotgun',page:182,category:'Weapon',summary:'Powerful short-range two-handed firearm.',attack:attack('DEX',undefined,1,10,'Piercing','30 feet') },
  { id:'shuriken',name:'Shuriken',page:182,category:'Weapon',summary:'Light thrown weapon with extra-attack upgrades.',attack:attack('DEX','STR',1,4,'Piercing','30 feet') },
  { id:'slingshot',name:'Slingshot',page:182,category:'Weapon',summary:'Two-handed ranged weapon with strong AI Favor potential.',attack:attack('DEX','STR',1,2,'Bludgeoning','30 feet') },
  { id:'herding-weapons',name:'Herding Weapon',page:182,category:'Weapon',summary:'Two-handed reach weapon such as a shepherd’s crook.',attack:attack('STR','STR',1,4,'Bludgeoning','10 feet') },
  { id:'lance',name:'Lance',page:182,category:'Weapon',summary:'Mounted reach weapon that rewards momentum.',attack:attack('STR','STR',1,12,'Piercing','10 feet') },
  { id:'polearm',name:'Polearm',page:183,category:'Weapon',summary:'Two-handed piercing reach weapon.',attack:attack('STR','STR',1,8,'Piercing','10 feet') },
  { id:'quarterstaff',name:'Quarterstaff',page:183,category:'Weapon',summary:'Two-handed bashing reach weapon.',attack:attack('STR','STR',1,6,'Bludgeoning','10 feet') },
]

export const ITEM_CATALOG: InventoryCatalogEntry[] = [
  ...WEAPON_CATALOG,
  { id:'healing-potion',name:'Healing Potion',page:216,category:'Consumable',summary:'Restores 5 Health Bar slots.' },
  { id:'good-healing-potion',name:'Good Healing Potion',page:216,category:'Consumable',summary:'Restores 6 Health Bar slots.' },
  { id:'gold-healing-potion',name:'Gold Standard Healing Potion',page:217,category:'Consumable',summary:'Restores 7 Health Bar slots and mends one Minor Injury.' },
  { id:'supreme-healing-potion',name:'Supreme Healing Potion',page:217,category:'Consumable',summary:'Restores 8 Health Bar slots and mends one Minor or Major Injury.' },
  { id:'mana-potion',name:'Standard Mana Potion',page:216,category:'Consumable',summary:'Fully restores Mana.' },
  { id:'good-mana-potion',name:'Good Mana Refill Potion',page:217,category:'Consumable',summary:'Restores 15 Mana per round for 10 rounds.' },
  { id:'bandage',name:'Bandage',page:216,category:'Consumable',summary:'Spend an Action to remove the Blood Trail Debuff.' },
  { id:'poison-antidote',name:'Poison Antidote',page:216,category:'Consumable',summary:'Antidote for poison effects.' },
  { id:'crawler-biscuit',name:'Crawler Biscuit',page:216,category:'Consumable',summary:'Common dungeon food for crawlers.' },
  { id:'rope',name:'Rope (50 feet)',page:216,category:'Adventuring gear',summary:'Fifty feet of useful rope.' },
  { id:'torch-item',name:'Torch',page:216,category:'Adventuring gear',summary:'Bright light for 20 feet, dim for another 20 feet, lasting about an hour.' },
  { id:'basic-dynamite',name:'Stick of Basic Dynamite',page:183,category:'Explosive',summary:'1d6 Bludgeoning, 0ft Blast radius and 5ft Splash.',attack:attack('DEX',undefined,1,6,'Bludgeoning','Thrown',[0,0,0],'0ft Blast · +5ft Splash') },
  { id:'goblin-dynamite',name:'Good Goblin Dynamite',page:183,category:'Explosive',summary:'2d6 Bludgeoning, 5ft Blast radius and 5ft Splash.',attack:attack('DEX',undefined,2,6,'Bludgeoning','Thrown',[0,0,0],'5ft Blast · +5ft Splash') },
  { id:'carls-jug',name:'Carl’s Jug O’ Boom',page:183,category:'Explosive',summary:'1d8 Fire with Blast, Splash, and Burned potential.',attack:attack('DEX',undefined,1,8,'Fire','Thrown',[0,0,0],'5ft Blast · +15ft Splash · Burned') },
  { id:'hob-lobber',name:'Hob-Lobber',page:183,category:'Explosive',summary:'3d6 Piercing with 10ft Splash.',attack:attack('DEX',undefined,3,6,'Piercing','Thrown',[0,0,0],'+10ft Splash') },
]

const spell = (id:string,name:string,page:number,category:string,manaCost:number|null,summary:string,profile?:AttackProfile): SpellCatalogEntry =>
  ({ id,name,page,category,manaCost,summary,attack:profile })

export const SPELL_CATALOG: SpellCatalogEntry[] = [
  spell('air-buddy','Air Buddy',202,'Movement',12,'Launch yourself through the air.'),
  spell('astral-paw','Astral Paw',203,'Utility',12,'Conjure a spectral appendage for distant manipulation.'),
  spell('bad-faith','Bad Faith',203,'Attack',10,'Charisma-based necrotic attack favored by Clerics.',attack('CHA','CHA',1,8,'Necrotic','40 feet')),
  spell('bang-bro','Bang Bro',203,'Enhancement',5,'Temporarily add mixed Fire and Electric damage to a held weapon.'),
  spell('clockwork-triplicate','Clockwork Triplicate',203,'Summoning',26,'Split a pet or minion into three temporary versions.'),
  spell('confusing-fog','Confusing Fog',204,'Control',6,'Create fog that hinders enemy attacks.'),
  spell('dirt-clod','Dirt Clod',204,'Attack',1,'Low-cost magical bludgeoning attack.',attack('INT','INT',1,2,'Bludgeoning','100 feet',[2,1,1])),
  spell('drain-life','Drain Life',204,'Attack',14,'Necrotic attack that can restore Health.',attack('INT','INT',1,6,'Necrotic','30 feet')),
  spell('earworm','Earworm',204,'Attack',6,'Charisma-based sonic attack favored by Bards.',attack('CHA','CHA',1,6,'Sonic','30 feet')),
  spell('fear','Fear',204,'Control attack',3,'Frighten a qualifying non-Boss Mob.',attack('INT',undefined,undefined,undefined,undefined,'25 feet',[0,0,0],'Mind Control')),
  spell('fireball','Fireball',205,'Attack',45,'High-impact fire attack with a Blast area.',attack('INT','INT',1,12,'Fire','80 feet',[1,1,1],'10ft Blast')),
  spell('fire-fingers','Fire Fingers',205,'Attack',3,'Close-range fire attack.',attack('INT','INT',1,4,'Fire','Melee')),
  spell('frost-scar','Frost Scar',205,'Attack',2,'Melee ice attack with debilitating upgrades.',attack('INT','INT',1,4,'Ice','Melee')),
  spell('grand-illusion','Grand Illusion',205,'Control',7,'Create an illusion opposed by Intelligence.'),
  spell('heal','Heal',206,'Healing',2,'Interrupt that restores up to 2 of your Health Bar slots.'),
  spell('heal-critter','Heal Critter',206,'Healing',8,'Fully restore a pet or minion.'),
  spell('heal-others','Heal Others',206,'Healing',6,'Restore another crawler’s Health.'),
  spell('heal-self','Heal Self',206,'Healing',1,'Restore your own Health with Rank-based improvements.'),
  spell('hole','Hole',206,'Utility',12,'Create a temporary opening through a nonliving surface.'),
  spell('holy-aura','Holy Aura',207,'Attack',7,'Charisma-based holy Burst favored by Clerics and Paladins.',attack('CHA','CHA',1,4,'Holy','5ft Burst')),
  spell('hot-stuff-aura','Hot Stuff Aura',207,'Protection',8,'Charisma-powered protective aura for nearby allies.'),
  spell('ice-blast','Ice Blast',207,'Attack',9,'Freezing attack with push and Cone upgrades.',attack('INT','INT',1,8,'Ice','40 feet')),
  spell('icicles','Icicles',207,'Attack',19,'Long-range ice projectiles.',attack('INT','INT',1,12,'Ice','60 feet')),
  spell('intimate-touches','Intimate Touches',208,'Healing',8,'Touch-range healing favored by Clerics and Paladins.'),
  spell('lightning-bolt','Lightning Bolt',208,'Attack',15,'Long-range electric attack.',attack('INT','INT',1,10,'Electric','100 feet')),
  spell('magic-missile','Magic Missile',208,'Attack',5,'Force projectile with flexible Mana upgrades.',{...attack('INT','INT',1,4,'Force','Line of sight'),rank15Multiplier:3}),
  spell('mind-tickle','Mind Tickle',208,'Attack',2,'Low-cost Charisma-based psychic attack.',attack('CHA','CHA',1,2,'Psychic','40 feet')),
  spell('minion-army','Minion Army',209,'Control',50,'Temporarily influence a group as minions.'),
  spell('natures-breath','Nature’s Breath',209,'Healing',6,'Nature healing favored by Druids.'),
  spell('oakhide','Oakhide',209,'Protection',5,'Harden a target with bark-like magical protection.'),
  spell('paladins-smite','Paladin’s Smite',209,'Attack',11,'Charisma-based holy attack favored by Paladins.',attack('CHA','CHA',1,8,'Holy','Melee')),
  spell('panty-dropper','Panty Dropper',209,'Control',10,'Charisma-based Mind Control favored by Bards.'),
  spell('ping','Ping',210,'Detection',5,'Locate nearby non-crawlers and eligible Mobs.'),
  spell('protective-shell','Protective Shell',210,'Protection',null,'Imbued emergency shell with no Mana cost.'),
  spell('puddle-jumper','Puddle Jumper',210,'Movement',20,'Teleport yourself and party members within sight.'),
  spell('rise-dead-minion','Rise, Dead Minion!',211,'Summoning attack',10,'Animate a corpse as a temporary minion.',attack('INT',undefined,undefined,undefined,undefined,'30 feet',[0,0,0],'Creates a dead minion on Success')),
  spell('rootfoot','Rootfoot',211,'Control attack',5,'Use roots to hinder a target.',attack('INT',undefined,undefined,undefined,undefined,'40 feet',[0,0,0],'Root control effect')),
  spell('second-chance','Second Chance',211,'Protection',10,'Give a target another opportunity after failure.'),
  spell('shield','Shield',211,'Protection',8,'Conjure an Interrupt defensive shield.'),
  spell('shock-treatment','Shock Treatment',212,'Attack',2,'Low-cost electric attack.',attack('INT','INT',1,2,'Electric','40 feet')),
  spell('solsplash','Solsplash',212,'Attack',13,'Constitution-based fire attack favored by Druids.',attack('CON','CON',1,8,'Fire','40 feet')),
  spell('soul-collector','Soul Collector',212,'Attack',4,'Necrotic attack that collects spiritual energy.',attack('INT','INT',1,4,'Necrotic','40 feet')),
  spell('thunderlash','Thunderlash',212,'Attack',12,'Powerful sonic attack.',attack('INT','INT',1,10,'Sonic','40 feet')),
  spell('torch-spell','Torch',212,'Utility',1,'Create magical light.'),
  spell('tripper','Tripper',213,'Control',null,'Imbued trap-triggering effect with no Mana cost.'),
  spell('turn-undead','Turn Undead',213,'Control attack',9,'Charisma-opposed Cone that drives undead away.',attack('CHA',undefined,undefined,undefined,undefined,'10ft Cone',[0,0,0],'Turn Undead')),
  spell('twinkle-toes','Twinkle Toes',213,'Movement',2,'Increase a pet or minion’s Move.'),
  spell('unnecessary-force','Unnecessary Force',213,'Attack',13,'Powerful Force attack that can push its target.',attack('INT','INT',1,12,'Force','40 feet')),
  spell('vine-porn','Vine Porn',213,'Attack',3,'Constitution-based piercing vines favored by Druids.',attack('CON','CON',1,4,'Piercing','20 feet')),
  spell('wall-of-fire','Wall of Fire',214,'Control damage',15,'Create a persistent wall dealing damage per foot crossed.'),
  spell('water-breathing','Water Breathing',214,'Utility',2,'Breathe safely underwater.'),
  spell('web','Web',214,'Control attack',6,'Cone attack that applies Held on Success.',attack('INT',undefined,undefined,undefined,undefined,'20ft Cone',[0,0,0],'Held')),
  spell('wilburs-fireblast','Wilbur’s Slow-Build Fireblast',214,'Attack',60,'Charge and hold a devastating fire attack.',attack('INT','INT',1,8,'Fire','50 feet')),
  spell('wisp-armor','Wisp Armor',214,'Protection',5,'Reduce incoming magic damage and resist Mind Control.'),
]

export const SPELL_BY_ID = new Map(SPELL_CATALOG.map((entry) => [entry.id, entry]))
export const ITEM_BY_ID = new Map(ITEM_CATALOG.map((entry) => [entry.id, entry]))

export function damageDiceAtRank(profile: AttackProfile, rank: number): number {
  if (!profile.baseDice || !profile.dieSides) return 0
  const upgrades = profile.upgradeDice ?? [0, 0, 0]
  return profile.baseDice + (rank >= 5 ? upgrades[0] : 0) + (rank >= 10 ? upgrades[1] : 0) + (rank >= 15 ? upgrades[2] : 0)
}
