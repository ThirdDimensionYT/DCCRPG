import { useMemo, useState } from 'react'
import { damageDiceAtRank, ITEM_BY_ID, SPELL_BY_ID, type AttackProfile, type CombatStat } from '../shared/catalog'
import type { Character, CharacterSheetData } from './api'
import { rollDie, type RollMode } from './dice'

type CombatAction = {
  id: string
  name: string
  source: 'Weapon' | 'Spell' | 'Explosive'
  rank: number
  page: number
  manaCost?: number | null
  profile: AttackProfile
}

type Resolution = {
  action: CombatAction
  mode: RollMode
  attackRolls: number[]
  natural: number
  attackModifier: number
  attackTotal: number
  phase: 'attack' | 'damage' | 'effect'
  damageRolls?: number[]
  damageModifier?: number
  damageTotal?: number
  multiplier?: number
}

function statModifier(value: number) {
  if (value >= 300) return 10
  if (value >= 200) return 9
  if (value >= 150) return 8
  if (value >= 100) return 7
  if (value >= 50) return 6
  if (value >= 20) return 5
  if (value >= 10) return 4
  if (value >= 6) return 3
  if (value >= 3) return 2
  return 1
}

function statScore(character: Character, stat: CombatStat): number {
  if (stat === 'STR') return character.strength
  if (stat === 'INT') return character.intelligence
  if (stat === 'CON') return character.constitution
  if (stat === 'DEX') return character.dexterity
  return character.charisma
}

function damageNotation(action: CombatAction): string {
  const count = damageDiceAtRank(action.profile, action.rank)
  if (!count || !action.profile.dieSides) return 'Effect on hit'
  const stat = action.profile.damageStat ? ' + ' + action.profile.damageStat : ''
  const multiplier = action.profile.rank15Multiplier && action.rank >= 15 ? ' ×' + action.profile.rank15Multiplier : ''
  return count + 'd' + action.profile.dieSides + stat + multiplier + (action.profile.damageType ? ' ' + action.profile.damageType : '')
}

export default function CombatActions({ character, sheet }: { character: Character; sheet: CharacterSheetData }) {
  const [resolution, setResolution] = useState<Resolution | null>(null)
  const actions = useMemo<CombatAction[]>(() => {
    const weapons = sheet.managedInventory.flatMap((item) => {
      const entry = ITEM_BY_ID.get(item.catalogId)
      if (!item.equipped || !item.quantity || !entry?.attack) return []
      return [{ id: item.id, name: entry.name, source: entry.category === 'Explosive' ? 'Explosive' as const : 'Weapon' as const, rank: item.rank, page: entry.page, profile: entry.attack }]
    })
    const spells = sheet.spells.flatMap((spell) => {
      const entry = SPELL_BY_ID.get(spell.catalogId)
      if (!spell.hotlisted || !entry?.attack) return []
      return [{ id: spell.id, name: entry.name, source: 'Spell' as const, rank: spell.rank, page: entry.page, manaCost: entry.manaCost, profile: entry.attack }]
    })
    return [...weapons, ...spells]
  }, [sheet])

  const knownSpells = sheet.spells.flatMap((spell) => {
    const entry = SPELL_BY_ID.get(spell.catalogId)
    return entry ? [{ spell, entry }] : []
  })
  const inventory = sheet.managedInventory.flatMap((item) => {
    const entry = ITEM_BY_ID.get(item.catalogId)
    return entry && item.quantity ? [{ item, entry }] : []
  })

  function rollAttack(action: CombatAction, mode: RollMode) {
    const attackRolls = mode === 'normal' ? [rollDie(20)] : [rollDie(20), rollDie(20)]
    const natural = mode === 'advantage' ? Math.max(...attackRolls) : mode === 'disadvantage' ? Math.min(...attackRolls) : attackRolls[0]
    const attackModifier = action.rank + statModifier(statScore(character, action.profile.toHitStat))
    setResolution({ action, mode, attackRolls, natural, attackModifier, attackTotal: natural + attackModifier, phase: 'attack' })
  }

  function confirmHit() {
    if (!resolution) return
    const count = damageDiceAtRank(resolution.action.profile, resolution.action.rank)
    const sides = resolution.action.profile.dieSides
    if (!count || !sides) {
      setResolution({ ...resolution, phase: 'effect' })
      return
    }
    const damageRolls = Array.from({ length: count }, () => rollDie(sides))
    const damageModifier = resolution.action.profile.damageStat ? statModifier(statScore(character, resolution.action.profile.damageStat)) : 0
    const multiplier = resolution.action.profile.rank15Multiplier && resolution.action.rank >= 15 ? resolution.action.profile.rank15Multiplier : 1
    const damageTotal = damageRolls.reduce((sum, roll) => sum + roll, 0) * multiplier + damageModifier
    setResolution({ ...resolution, phase: 'damage', damageRolls, damageModifier, damageTotal, multiplier })
  }

  return <section className="combat-console">
    <div className="panel-heading"><div><p className="eyebrow">Click to roll</p><h3>Combat actions</h3><p>Roll the attack, confirm the hit, then damage is rolled automatically.</p></div><span className="count-badge">{actions.length} ready</span></div>
    {actions.length ? <div className="combat-action-grid">{actions.map((action) => <article key={action.id}><header><span>{action.source}</span><a href={'/api/rulebook#page=' + (action.page + 2)} target="_blank" rel="noreferrer">p. {action.page}</a></header><strong>{action.name}</strong><small>Rank {action.rank} · d20 + {action.rank + statModifier(statScore(character,action.profile.toHitStat))} to hit</small><p>{damageNotation(action)} · {action.profile.range}{action.manaCost !== undefined ? ' · ' + (action.manaCost === null ? 'No Mana' : action.manaCost + ' Mana') : ''}</p>{action.profile.effect ? <em>{action.profile.effect}</em> : null}<div><button type="button" className="primary-button" onClick={() => rollAttack(action,'normal')}>Roll attack</button><button type="button" className="ghost-button" onClick={() => rollAttack(action,'advantage')}>ADV</button><button type="button" className="ghost-button" onClick={() => rollAttack(action,'disadvantage')}>DIS</button></div></article>)}</div> : <div className="combat-empty"><p>Equip a managed weapon or place an attack Spell in the Hotlist to make it rollable here.</p></div>}

    {resolution ? <div className={'roll-resolution ' + resolution.phase} aria-live="polite"><button type="button" className="resolution-close" onClick={() => setResolution(null)}>×</button><div className="resolution-die die-shape die-d20"><strong>{resolution.attackTotal}</strong><small>Attack total</small></div><div><span className="entry-kind">{resolution.action.source} attack</span><h4>{resolution.action.name}</h4><p>d20 rolled {resolution.attackRolls.join(' & ')}{resolution.mode !== 'normal' ? ' · ' + resolution.mode : ''} · kept {resolution.natural} + {resolution.attackModifier}</p>{resolution.natural === 20 ? <b className="critical">Natural 20!</b> : resolution.natural === 1 ? <b className="critical fail">Natural 1</b> : null}{resolution.phase === 'attack' ? <div className="resolution-actions"><button type="button" className="ghost-button" onClick={() => setResolution(null)}>Attack missed</button><button type="button" className="primary-button" onClick={confirmHit}>Confirm hit & roll damage</button></div> : resolution.phase === 'damage' ? <div className="damage-result"><strong>{resolution.damageTotal}</strong><span>{resolution.action.profile.damageType} damage</span><small>Rolled {resolution.damageRolls?.join(' + ')}{resolution.multiplier && resolution.multiplier > 1 ? ' × ' + resolution.multiplier : ''}{resolution.damageModifier ? ' + ' + resolution.damageModifier + ' ' + resolution.action.profile.damageStat : ''}</small></div> : <div className="damage-result effect"><strong>HIT</strong><span>{resolution.action.profile.effect ?? 'Apply the Spell effect'}</span><small>This attack does not roll direct damage. Use the linked rulebook entry for its full effect.</small></div>}</div></div> : null}

    <div className="managed-sheet-columns">
      <section><div className="panel-heading"><div><p className="eyebrow">Known magic</p><h3>Spells</h3></div><span className="count-badge">{knownSpells.length}</span></div>{knownSpells.length ? <div className="compact-managed-list">{knownSpells.map(({spell,entry}) => <article key={spell.id}><div><strong>{entry.name}</strong><small>{entry.category} · Rank {spell.rank} · {entry.manaCost === null ? 'No Mana' : entry.manaCost + ' Mana'}</small></div><span>{spell.hotlisted ? 'Hotlist' : 'Known'}</span></article>)}</div> : <p className="empty-copy">No managed Spells.</p>}</section>
      <section><div className="panel-heading"><div><p className="eyebrow">Carried assets</p><h3>Inventory</h3></div><span className="count-badge">{inventory.length}</span></div>{inventory.length ? <div className="compact-managed-list">{inventory.map(({item,entry}) => <article key={item.id}><div><strong>{entry.name}</strong><small>{entry.category}{item.notes ? ' · ' + item.notes : ''}</small></div><span>×{item.quantity}{item.equipped ? ' · Equipped' : ''}</span></article>)}</div> : <p className="empty-copy">No managed inventory.</p>}</section>
    </div>
  </section>
}
