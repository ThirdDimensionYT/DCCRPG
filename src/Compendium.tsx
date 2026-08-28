import { useMemo, useState } from 'react'
import { damageDiceAtRank, WEAPON_CATALOG } from '../shared/catalog'
import { CLASSES, RACES, SKILLS, statRuleSummary, type RuleOption } from '../shared/rules'

type Category = 'Rules' | 'Races' | 'Classes' | 'Skills' | 'Weapons' | 'Spells' | 'Gear & Loot'
type Entry = RuleOption
type RawEntry = [string, number, string, string]

function entriesFrom(data: RawEntry[]): Entry[] {
  return data.map(([name, page, group, summary]) => ({ name, page, group, summary }))
}

const rules = entriesFrom([
  ['Core dice rules',54,'Rule reference','Checks, dice pools, modifiers, Advantage, Disadvantage, and result levels.'],
  ['Stats and modifiers',62,'Rule reference','The five Stats, modifiers, enhanced values, and Stat damage.'],
  ['Actions and movement',68,'Rule reference','Actions, Interrupts, movement, range, falling, and scene timing.'],
  ['Combat',80,'Rule reference','Initiative, attacks, Evade, damage, armor, critical results, and Area effects.'],
  ['Health and dying',92,'Rule reference','Health Bar slots, healing, injuries, Dying, and death.'],
  ['Character creation',100,'Rule reference','Crawler concept, background, Stats, equipment, and starting experiences.'],
  ['Leveling and Floors',122,'Rule reference','Starting Levels by Floor, advancement, Stat points, and Floor progression.'],
  ['Races',128,'Rule reference','Race selection, prerequisites, abilities, and Stat changes.'],
  ['Classes',142,'Rule reference','Class groups, prerequisites, starting benefits, and Stat changes.'],
  ['Skills',172,'Rule reference','Skill types, Checks, Ranks, upgrades, advancement, and training.'],
  ['Attack skills',177,'Rule reference','Natural, melee, martial, ranged, and mounted attack Skills.'],
  ['Utility skills',184,'Rule reference','Exploration, social, technical, survival, and specialist Skills.'],
  ['Spells',202,'Rule reference','Casting, Mana, targeting, favored Classes, cooldowns, and Rank upgrades.'],
  ['Loot',215,'Rule reference','Mob and Boss looting, maps, gold, gear, consumables, materials, and loot boxes.'],
  ['Crafting',221,'Rule reference','Mundane and magical crafting, tables, enchanting, scrolls, potions, and tattoos.'],
  ['Pets',228,'Rule reference','Acquiring, bonding, roles, special abilities, leveling, gear, and commands.'],
  ['Mounts',232,'Rule reference','Acquiring, riding, pricing, movement, upgrades, and mounted combat.'],
  ['Minions',233,'Rule reference','Creating, controlling, commanding, and releasing minions.'],
  ['Game Master guidance',234,'Rule reference','Running sessions, Checks, scenes, rewards, threats, and campaign tools.'],
  ['Mobs and encounters',244,'Rule reference','Mob creation, Stats, abilities, combat roles, and encounter building.'],
  ['Quests and achievements',266,'Rule reference','Quest construction, achievements, rewards, and consequences.'],
  ['Iconic gear appendix',634,'Rule reference','Reference entries for notable gear from the Dungeon Crawler Carl setting.'],
  ['Royal Court appendix',638,'Rule reference','Reference material for the Celestial Ascendancy and Royal Court.'],
  ['Achievements appendix',644,'Rule reference','Achievement examples and system-awarded recognition.'],
  ['Rules index',646,'Rule reference','Alphabetical index for locating specific rules in the full rulebook.'],
])

const spells = entriesFrom([
  ['Air Buddy',202,'Movement','Launch yourself through the air, with later upgrades for distance and passengers.'],
  ['Astral Paw',203,'Utility','Conjure a spectral appendage that manipulates distant objects and performs suitable Checks.'],
  ['Bad Faith',203,'Attack','A Charisma-based necrotic attack favored by Clerics.'],
  ['Bang Bro',203,'Enhancement','Temporarily enchant a held weapon with mixed fire and electric damage.'],
  ['Clockwork Triplicate',203,'Summoning','Split a pet or minion into three temporary clockwork versions.'],
  ['Confusing Fog',204,'Control','Create friendly-visible fog that hinders enemy attacks.'],
  ['Dirt Clod',204,'Attack','Hurl a low-cost magical clod that deals bludgeoning damage.'],
  ['Drain Life',204,'Attack','Deal necrotic damage and unlock healing when enough Health is removed.'],
  ['Earworm',204,'Attack','A Charisma-based sonic attack favored by Bards.'],
  ['Fear',204,'Control','Frighten a qualifying non-Boss Mob and disrupt its ability to fight.'],
  ['Fireball',205,'Attack','A slow, high-impact fire sphere with a Blast area.'],
  ['Fire Fingers',205,'Attack','Deliver a close-range fire attack that later enhances unarmed strikes.'],
  ['Frost Scar',205,'Attack','A melee ice attack that can inhibit healing and inflict Debuffs.'],
  ['Grand Illusion',205,'Control','Create an illusion and test it against creatures who can see it.'],
  ['Heal',206,'Healing','An Interrupt that restores a limited number of your own Health Bar slots.'],
  ['Heal Critter',206,'Healing','Fully restore a pet or minion and unlock injury recovery at higher Ranks.'],
  ['Heal Others',206,'Healing','Restore another crawler, later expanding to party-wide healing.'],
  ['Heal Self',206,'Healing','Restore your own Health and gain stronger recovery at higher Ranks.'],
  ['Hole',206,'Utility','Create a temporary cylindrical opening through a nonliving surface.'],
  ['Holy Aura',207,'Attack','A Charisma-based holy Burst favored by Clerics and Paladins.'],
  ['Hot Stuff Aura',207,'Protection','Create a Charisma-powered protective shield around nearby allies.'],
  ['Ice Blast',207,'Attack','Project compact freezing force that can push targets or become a Cone.'],
  ['Icicles',207,'Attack','Launch long-range ice projectiles with Debuff and armor-piercing upgrades.'],
  ['Intimate Touches',208,'Healing','Lay hands on a target to restore Health and later remove Injuries and ailments.'],
  ['Lightning Bolt',208,'Attack','Fire a long-range electric bolt that can become a Line and fork between targets.'],
  ['Magic Missile',208,'Attack','Launch a force projectile with flexible Mana and damage upgrades.'],
  ['Mind Tickle',208,'Attack','A low-cost Charisma-based psychic attack favored by Clerics.'],
  ['Minion Army',209,'Control','Temporarily influence a group of qualifying creatures as minions.'],
  ['Nature’s Breath',209,'Utility','Use nature magic to refresh and support creatures in an area.'],
  ['Oakhide',209,'Protection','Harden a target with bark-like magical protection.'],
  ['Paladin’s Smite',209,'Attack','A Charisma-based holy strike favored by Paladins.'],
  ['Panty Dropper',209,'Control','Use Charisma magic to influence a target socially.'],
  ['Ping',210,'Detection','Send out a magical search pulse to locate nearby creatures or features.'],
  ['Protective Shell',210,'Protection','Create a temporary defensive shell around a target.'],
  ['Puddle Jumper',210,'Movement','Teleport through suitable water to reposition quickly.'],
  ['Rise, Dead Minion!',211,'Summoning','Animate a corpse as a temporary undead minion.'],
  ['Rootfoot',211,'Control','Call roots from the ground to restrain or hinder a target.'],
  ['Second Chance',211,'Protection','Intervene to give a target another opportunity after a failed outcome.'],
  ['Shield',211,'Protection','Conjure magical protection against incoming harm.'],
  ['Shock Treatment',212,'Attack','Deliver electric damage with increasingly disruptive upgrades.'],
  ['Solsplash',212,'Attack','Project concentrated solar energy at enemies.'],
  ['Soul Collector',212,'Summoning','Capture and reuse spiritual energy through necromantic magic.'],
  ['Thunderlash',212,'Attack','Strike with a loud sonic or electric magical lash.'],
  ['Torch',212,'Utility','Create magical light for exploring dark areas.'],
  ['Tripper',213,'Control','Use magic to disrupt footing and knock targets down.'],
  ['Turn Undead',213,'Control','Drive undead creatures away with holy power.'],
  ['Twinkle Toes',213,'Movement','Grant magical aerial movement or flight.'],
  ['Unnecessary Force',213,'Attack','Apply excessive magical force to damage and displace a target.'],
  ['Vine Porn',213,'Control','Conjure vines that seize and control creatures or terrain.'],
  ['Wall of Fire',214,'Control','Create a persistent fiery barrier that controls movement and deals damage.'],
  ['Water Breathing',214,'Utility','Allow targets to breathe safely underwater.'],
  ['Web',214,'Control','Project sticky webbing to restrain and hinder foes.'],
  ['Wilbur’s Slow-Build Fireblast',214,'Attack','Charge a fire attack over time for a larger eventual blast.'],
  ['Wisp Armor',214,'Protection','Surround a target with magical wisps that provide protection.'],
])

const weapons: Entry[] = WEAPON_CATALOG.map((entry) => {
  const profile = entry.attack!
  const baseDamage = damageDiceAtRank(profile, 1) + 'd' + profile.dieSides
  const maximumDamage = damageDiceAtRank(profile, 15) + 'd' + profile.dieSides
  const damageStat = profile.damageStat ? ' + ' + profile.damageStat : ''
  return {
    name: entry.name,
    page: entry.page,
    group: profile.range === 'Melee' || profile.range === '10 feet' ? 'Melee weapon' : 'Ranged weapon',
    summary: entry.summary + ' To hit: ' + profile.toHitStat + '. Base damage: ' + baseDamage + damageStat + ' ' + profile.damageType + '. Range: ' + profile.range + '. Rank 15 damage dice: ' + maximumDamage + '.',
  }
})

const gear = entriesFrom([
  ['Looting Mobs',215,'Loot rules','How defeated Mobs provide gold, gear, consumables, materials, and map information.'],
  ['Looting Bosses',215,'Loot rules','Boss rewards and the special handling of higher-value loot.'],
  ['Gold',216,'Loot contents','Dungeon currency, merchant use, Mob drops, and Inventory storage.'],
  ['Mundane items',216,'Loot contents','Common adventuring supplies such as biscuits, torches, rope, and transport.'],
  ['Gear',216,'Loot contents','Armor, weapons, magical equipment, Gear Slots, and enchantments.'],
  ['Consumables',216,'Loot contents','Potions, scrolls, explosives, bandages, and Hotlist-ready items.'],
  ['Rare materials',216,'Loot contents','Materials used in crafting or sold for gold.'],
  ['Coupons and furniture',216,'Loot contents','Personal-space rooms, furnishings, and specialized equipment.'],
  ['Bronze Boxes',216,'Loot boxes','Entry-tier mundane items, weak magic, basic consumables, and modest gold.'],
  ['Silver Boxes',216,'Loot boxes','More frequent magical gear, stronger consumables, permanent bonuses, and scrolls.'],
  ['Gold Boxes',217,'Loot boxes','Strong magical items, crafting tables, upgrades, and substantial gold.'],
  ['Platinum Boxes',217,'Loot boxes','Major gear upgrades, permanent magic, coupons, and powerful consumables.'],
  ['Legendary Boxes',218,'Loot boxes','Extremely rare, transformative rewards and high-value magic.'],
  ['Celestial Boxes',218,'Loot boxes','Divine and campaign-changing items at the highest reward tier.'],
  ['Bitch-Ass Buckler',217,'Sample gear','Silver-box hand gear that improves Shield Block and Damage Resistance.'],
  ['Bernie Boots',217,'Sample gear','Silver-box foot gear that preserves limited movement while Dying.'],
  ['Big Purple Plume',217,'Sample gear','Silver-box accessory that improves Charisma.'],
  ['Friendship Bracelet of [Race]kind',217,'Sample gear','Silver-box accessory that changes first reactions from one randomly selected Race.'],
  ['Enchanted Elbow Pads of the Elbow-Walking Turkeys',217,'Sample gear','Gold-box arm gear that improves Damage Resistance and Dexterity.'],
  ['Skullcap of Sucking',217,'Sample gear','Gold-box head gear that converts Critical Fails into AI Favor.'],
  ['Tough Guy Tattoo',217,'Sample gear','Gold-box accessory that improves Constitution and the top Health slot.'],
  ['Selfie Stick of the Self-Mutilator',218,'Sample gear','Platinum hand gear trading Health for Popularity and extra combat Actions.'],
  ['Chesty Cheese Grater',218,'Sample gear','Platinum torso gear with Damage Resistance and melee damage reflection.'],
  ['Enchanted Leggings of Insanity',218,'Sample gear','Platinum leg gear that improves escaping and squeezing through openings.'],
  ['Medicine or Lube? Scratcher',218,'Sample gear','A cooldown consumable with a random healing or hindering effect.'],
  ['Nebular Roulette Scratcher',218,'Sample gear','A risky cooldown consumable that randomly directs electric damage.'],
  ['Enchanted Cloak of the Slippery Perv',218,'Sample gear','Legendary accessory improving Charisma with a conditional Evade Buff.'],
  ['Enchanted Wand of Incontinence',218,'Sample gear','Legendary held gear improving Constitution with a once-per-session effect.'],
  ['Hand Grips of Hella Holding',218,'Sample gear','Legendary hand gear improving Strength, protection, and grip.'],
  ['Borant Corporation Reset Button',219,'Sample gear','Celestial accessory able to restart a recent scene once per Floor.'],
  ['Beret of Divine Intervention',219,'Sample gear','Celestial head gear that maximizes a Skill and multiplies deity-related rewards.'],
  ['The Sassy Stiletto',219,'Sample gear','Intelligent Celestial dagger with major Stat, Skill, critical, and Perception benefits.'],
  ['Randomized magic items',219,'Magic item rules','Rarity-based creation tables for enchanted weapons, clothing, accessories, and unique effects.'],
  ['X values and unique effects',220,'Magic item rules','How rarity determines variable bonuses and unusual magical properties.'],
  ['Crafting mundane items',221,'Crafting','Materials, time, Difficulty, tools, and common or uncommon projects.'],
  ['Crafting magic items',222,'Crafting','Fourth-Floor magical projects, item sizes, bonus levels, and requirements.'],
  ['Crafting tables',223,'Crafting','Table types, required Skills, table upgrades, and project support.'],
  ['Enchanting items',223,'Crafting','Adding magical benefits and managing the risks of over-enchantment.'],
  ['Scrolls, potions, arcane items, and tattoos',224,'Crafting','Specialized creation rules for consumable, inherent-Spell, and body-slot magic.'],
  ['Pets',228,'Companions','Bringing in, rewarding, adopting, buying, and bonding with pets.'],
  ['Pet roles and abilities',231,'Companions','Tank, Aggressive, and Utility roles plus special abilities and leveling.'],
  ['Pet gear and commands',232,'Companions','Equipping, storing, directing, and fighting alongside a bonded pet.'],
  ['Mounts',232,'Companions','Acquisition, pricing, upgrades, riding Checks, Actions, and combat use.'],
  ['Minions',233,'Companions','Command rules for summoned, animated, or quest-granted followers.'],
])

const categories: Category[] = ['Rules','Races','Classes','Skills','Weapons','Spells','Gear & Loot']
const categoryEntries: Record<Category, Entry[]> = {
  Rules: rules,
  Races: RACES,
  Classes: CLASSES,
  Skills: SKILLS,
  Weapons: weapons,
  Spells: spells,
  'Gear & Loot': gear,
}

export default function Compendium() {
  const [category, setCategory] = useState<Category>('Rules')
  const [query, setQuery] = useState('')
  const entries = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return categoryEntries[category].filter((entry) =>
      !normalized || [entry.name, entry.group, entry.summary, entry.requirement].some((value) => value?.toLowerCase().includes(normalized)),
    )
  }, [category, query])

  return <div className="content compendium">
    <section className="section-intro">
      <div><p className="eyebrow">Structured rules</p><h2>Compendium</h2><p>Search concise game references, then jump directly to the relevant page in your private rulebook for the complete wording.</p></div>
      <label className="compendium-search"><span>Search compendium</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Race, spell, gear, rule…" /></label>
    </section>
    <nav className="compendium-tabs" aria-label="Compendium categories">
      {categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}><span>{item}</span><b>{categoryEntries[item].length}</b></button>)}
    </nav>
    <div className="compendium-results-heading"><div><p className="eyebrow">{category}</p><h3>{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</h3></div>{query ? <button className="ghost-button" onClick={() => setQuery('')}>Clear search</button> : null}</div>
    {entries.length
      ? <div className="compendium-library">{entries.map((entry) => <article key={entry.name + '-' + entry.page}><header><span>{entry.group}</span><a href={'/api/rulebook#page=' + (entry.page + 2)} target="_blank" rel="noreferrer">Rulebook p. {entry.page} ↗</a></header><h3>{entry.name}</h3>{category === 'Races' || category === 'Classes' ? <b>{statRuleSummary(entry.name)}</b> : null}<p>{entry.summary}</p>{entry.requirement ? <footer><strong>Requirement</strong> {entry.requirement}</footer> : null}</article>)}</div>
      : <section className="panel compendium-empty"><h3>No matching entries</h3><p>Try another term or clear the search.</p></section>}
  </div>
}
