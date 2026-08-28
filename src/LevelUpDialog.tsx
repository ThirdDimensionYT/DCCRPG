import { useMemo, useState, type FormEvent } from 'react'
import {
  automaticLevelEffects,
  CLASSES,
  emptyStatBlock,
  levelStatPoints,
  OPTION_STAT_RULES,
  RACES,
  STAT_ABBREVIATIONS,
  STAT_KEYS,
  statRuleSummary,
  type StatBlock,
  type StatKey,
} from '../shared/rules'
import { parseCharacterSheetData, type Character } from './api'

const statNames: Record<StatKey, string> = { strength: 'Strength', intelligence: 'Intelligence', constitution: 'Constitution', dexterity: 'Dexterity', charisma: 'Charisma' }

export default function LevelUpDialog({ character, saving, onCancel, onConfirm }: {
  character: Character
  saving: boolean
  onCancel: () => void
  onConfirm: (levels: number, statPoints: StatBlock) => Promise<void>
}) {
  const sheet = useMemo(() => parseCharacterSheetData(character.sheet_data), [character.sheet_data])
  const pendingPoints = sheet.pendingStatPoints
  const [levels, setLevels] = useState(pendingPoints ? 0 : 1)
  const [allocated, setAllocated] = useState<StatBlock>(emptyStatBlock)
  const [localError, setLocalError] = useState<string | null>(null)
  const targetLevel = character.level + levels
  const points = pendingPoints + levelStatPoints(character.floor, levels)
  const remaining = points - STAT_KEYS.reduce((sum, key) => sum + allocated[key], 0)
  const automatic = automaticLevelEffects(character.race, character.level, targetLevel)
  const race = RACES.find((option) => option.name === character.race)
  const characterClass = CLASSES.find((option) => option.name === character.class_name)
  const hasStoredUnenhanced = useMemo(() => {
    try {
      const parsed = JSON.parse(character.sheet_data) as { unenhancedStats?: Record<string, unknown> }
      return Boolean(parsed.unenhancedStats && STAT_KEYS.every((key) => Number.isInteger(parsed.unenhancedStats?.[key])))
    } catch { return false }
  }, [character.sheet_data])
  const caps = useMemo(() => Object.fromEntries(STAT_KEYS.map((key) => [key, Math.min(
    OPTION_STAT_RULES[character.race]?.caps?.[key] ?? Number.POSITIVE_INFINITY,
    OPTION_STAT_RULES[character.class_name]?.caps?.[key] ?? Number.POSITIVE_INFINITY,
  )])) as StatBlock, [character.race, character.class_name])

  function setLevelCount(next: number) {
    setLevels(Math.max(pendingPoints ? 0 : 1, Math.min(250 - character.level, next)))
    setAllocated(emptyStatBlock())
    setLocalError(null)
  }

  function capacity(key: StatKey) {
    const currentUnenhanced = hasStoredUnenhanced ? sheet.unenhancedStats[key] : character[key]
    return Math.max(0, caps[key] - currentUnenhanced - automatic.statBonuses[key])
  }

  function allocate(key: StatKey, value: number) {
    setAllocated((current) => ({ ...current, [key]: Math.max(0, Math.min(points, capacity(key), value)) }))
  }

  function spreadEvenly() {
    const next = emptyStatBlock()
    let left = points
    while (left > 0) {
      const available = STAT_KEYS.filter((key) => next[key] < capacity(key))
      if (!available.length) break
      for (const key of available) {
        if (!left) break
        next[key] += 1
        left -= 1
      }
    }
    setAllocated(next)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (remaining !== 0) {
      setLocalError(`Allocate all ${points} Stat points before applying these Levels.`)
      return
    }
    setLocalError(null)
    await onConfirm(levels, allocated)
  }

  const automaticItems = [
    ...(pendingPoints ? [`${pendingPoints} banked Stat points from campaign Floor advancement`] : []),
    ...(levelStatPoints(character.floor,levels) ? [`${levelStatPoints(character.floor,levels)} new assignable Stat points (${levels} Level${levels === 1 ? '' : 's'} × 3)`] : []),
    ...(automatic.aiFavor ? [`+${automatic.aiFavor} AI Favor from the Primal Race`] : []),
    ...automatic.unlocks.map((unlock) => `${unlock.name}: ${unlock.summary}`),
  ]

  return <form className="level-up-form" onSubmit={(event) => void submit(event)}>
    <div className="modal-heading"><div><p className="eyebrow">Crawler advancement · Rulebook p. 169</p><h2>Level up {character.name}</h2></div><button type="button" onClick={onCancel}>×</button></div>
    <div className="level-transition"><div><small>Current</small><strong>{character.level}</strong></div><span>→</span><div><small>New Level</small><strong>{targetLevel}</strong></div><label>Additional Levels<input type="number" min={pendingPoints ? 0 : 1} max={250-character.level} value={levels} onChange={(event) => setLevelCount(Number(event.target.value))} /></label></div>

    <section className="level-effect-grid">
      <article><small>General progression</small><strong>{points ? `+${points} Stat points to assign` : 'No Stat points on this Floor'}</strong><p>{pendingPoints ? `${pendingPoints} points were banked when the campaign Floor advanced. Allocate them now, or add more Levels at the same time.` : character.floor <= 3 ? 'Each Level gained on the Third Floor or lower grants 3 points for both Enhanced and Unenhanced Stats.' : `The core rule grants level-up Stat points only on the Third Floor or lower. This crawler is on Floor ${character.floor}.`}</p></article>
      <article><small>Race · {character.race}</small><strong>{statRuleSummary(character.race)}</strong><p>{race?.summary}</p>{character.race === 'Primal' ? <em>Automatic: +1 AI Favor per Level.</em> : null}{character.race === 'Bune' ? <em>{targetLevel >= 50 ? 'Level 50 wings are available in this advancement.' : `Next Race milestone: strengthened wings at Level 50 (${50-targetLevel} Levels away).`}</em> : null}</article>
      <article><small>Class · {character.class_name}</small><strong>{statRuleSummary(character.class_name)}</strong><p>{characterClass?.summary}</p><em>The core rulebook defines this Class package at selection; it has no separate Level unlock track.</em></article>
    </section>

    {automaticItems.length ? <section className="automatic-effects"><p className="eyebrow">Applied with this advancement</p>{automaticItems.map((item) => <div key={item}><span>✓</span>{item}</div>)}</section> : null}

    {points ? <section className="level-stat-allocation"><header><div><h3>Assign Stat points</h3><p>These increases are applied to both Enhanced and Unenhanced Stats.</p></div><div><strong className={remaining < 0 ? 'over' : ''}>{remaining}</strong><small>remaining</small></div></header><div className="level-up-stats">{STAT_KEYS.map((key) => {
      const increase = allocated[key] + automatic.statBonuses[key]
      const finalValue = character[key] + increase
      return <label key={key}><span>{statNames[key]} <small>{STAT_ABBREVIATIONS[key]}</small></span><input type="number" min={0} max={Math.min(points,capacity(key))} value={allocated[key]} onChange={(event) => allocate(key,Number(event.target.value))} /><b>{character[key]} → {finalValue}</b>{Number.isFinite(caps[key]) ? <em>Cap {caps[key]}</em> : null}{automatic.statBonuses[key] ? <em>Includes +{automatic.statBonuses[key]} Race milestone</em> : null}</label>
    })}</div><div className="allocation-actions"><button type="button" className="text-button" onClick={spreadEvenly}>Spread evenly</button><button type="button" className="text-button" onClick={() => setAllocated(emptyStatBlock())}>Reset</button></div></section> : null}

    {localError ? <div className="auth-error">{localError}</div> : null}
    <p className="form-note">This action records an advancement entry and cannot be reversed automatically. The owner can still correct sheet values manually if a table ruling requires it.</p>
    <div className="modal-actions"><button type="button" className="ghost-button" onClick={onCancel}>Cancel</button><button className="primary-button" disabled={saving || remaining !== 0}>{saving ? 'Applying…' : levels ? `Apply Level${levels === 1 ? '' : 's'}` : 'Apply Stat points'}</button></div>
  </form>
}
