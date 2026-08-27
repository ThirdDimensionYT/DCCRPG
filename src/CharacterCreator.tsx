import { useMemo, useState } from 'react'
import {
  calculateStats,
  CLASSES,
  emptyStatBlock,
  LEVEL_OPTIONS,
  OPTION_STAT_RULES,
  RACES,
  SKILLS,
  STAT_KEYS,
  type RuleOption,
  type StatBlock,
  type StatKey,
} from '../shared/rules'
import type { Campaign } from './api'
import { rollStatDie } from './dice'

export type CharacterDraft = {
  name: string
  crawlerNumber: number
  race: string
  className: string
  campaignId: string | null
  skillNames: string[]
  level: 10 | 20 | 30
  statMethod: 'standard' | 'manual'
  rolledValues: number[]
  baseStats: StatBlock
  levelStatPoints: StatBlock
  raceFlexibleStats: StatBlock
  classFlexibleStats: StatBlock
}

const steps = ['Identity', 'Race', 'Class', 'Stats', 'Skills', 'Review'] as const
const labels: Record<StatKey, string> = { strength: 'Strength', intelligence: 'Intelligence', constitution: 'Constitution', dexterity: 'Dexterity', charisma: 'Charisma' }
const abbreviations: Record<StatKey, string> = { strength: 'STR', intelligence: 'INT', constitution: 'CON', dexterity: 'DEX', charisma: 'CHA' }

function modifier(value: number) {
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

function sumStats(stats: StatBlock) {
  return STAT_KEYS.reduce((total, key) => total + stats[key], 0)
}

function ruleSummary(name: string) {
  const rule = OPTION_STAT_RULES[name]
  if (!rule) return 'No fixed Stat changes.'
  const parts = STAT_KEYS.flatMap((key) => rule.fixed?.[key] ? [`${rule.fixed[key]! > 0 ? '+' : ''}${rule.fixed[key]} ${abbreviations[key]}`] : [])
  if (rule.flexible) parts.push(`+${rule.flexible.points} allocated ${rule.flexible.allToOne ? 'to one of' : 'between'} ${rule.flexible.stats.map((key) => abbreviations[key]).join('/')}`)
  if (rule.caps) parts.push(...STAT_KEYS.flatMap((key) => rule.caps?.[key] ? [`${abbreviations[key]} cap ${rule.caps[key]}`] : []))
  return parts.join(' · ') || 'No fixed Stat changes.'
}

function OptionList({ options, selected, onSelect }: { options: RuleOption[]; selected: string; onSelect: (name: string) => void }) {
  const [search, setSearch] = useState('')
  const visible = useMemo(() => options.filter((option) => `${option.name} ${option.group} ${option.summary}`.toLowerCase().includes(search.toLowerCase())), [options, search])
  return <>
    <label className="builder-search">Search<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${options === RACES ? 'races' : 'classes'}…`} /></label>
    <div className="builder-options">
      {visible.map((option) => <button type="button" key={option.name} className={selected === option.name ? 'selected' : ''} onClick={() => onSelect(option.name)}>
        <span><strong>{option.name}</strong><em>{option.group} · Rulebook p. {option.page}</em></span>
        <p>{option.summary}</p>
        <small className="stat-preview">Stats: {ruleSummary(option.name)}</small>
        {option.requirement ? <small>Limited: {option.requirement}</small> : null}
      </button>)}
    </div>
  </>
}

function FlexibleAllocation({ source, value, onChange }: { source: string; value: StatBlock; onChange: (value: StatBlock) => void }) {
  const flexible = OPTION_STAT_RULES[source]?.flexible
  if (!flexible) return null
  const used = sumStats(value)
  if (flexible.allToOne) return <div className="flex-stat-allocation"><strong>{flexible.label}</strong><p>Choose which form is active for the character sheet.</p><div>{flexible.stats.map((key) => <button type="button" key={key} className={value[key] === flexible.points ? 'selected' : ''} onClick={() => onChange({ ...emptyStatBlock(), [key]: flexible.points })}>{key === 'intelligence' ? 'Day' : 'Night'} · +{flexible.points} {abbreviations[key]}</button>)}</div></div>
  return <div className="flex-stat-allocation"><strong>{flexible.label}</strong><p>Allocate all {flexible.points} points between {flexible.stats.map((key) => labels[key]).join(', ')}. <b>{flexible.points - used} remaining</b></p><div>{flexible.stats.map((key) => <label key={key}>{abbreviations[key]}<input type="number" min={0} max={flexible.points} value={value[key]} onChange={(event) => onChange({ ...value, [key]: Math.max(0, Math.min(flexible.points, Number(event.target.value))) })} /></label>)}</div></div>
}

export default function CharacterCreator({ campaigns, saving, onCancel, onCreate }: { campaigns: Campaign[]; saving: boolean; onCancel: () => void; onCreate: (draft: CharacterDraft) => Promise<void> }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [crawlerNumber, setCrawlerNumber] = useState(500000)
  const [campaignId, setCampaignId] = useState('')
  const [level, setLevel] = useState<10 | 20 | 30>(10)
  const [race, setRace] = useState('')
  const [className, setClassName] = useState('')
  const [statMethod, setStatMethod] = useState<'standard' | 'manual'>('standard')
  const [rolledValues, setRolledValues] = useState<number[]>([])
  const [baseStats, setBaseStats] = useState<StatBlock>(emptyStatBlock)
  const [levelStatPoints, setLevelStatPoints] = useState<StatBlock>(emptyStatBlock)
  const [raceFlexibleStats, setRaceFlexibleStats] = useState<StatBlock>(emptyStatBlock)
  const [classFlexibleStats, setClassFlexibleStats] = useState<StatBlock>(emptyStatBlock)
  const [skills, setSkills] = useState<string[]>([])
  const [skillSearch, setSkillSearch] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const levelOption = LEVEL_OPTIONS.find((option) => option.level === level) ?? LEVEL_OPTIONS[0]
  const selectedRace = RACES.find((option) => option.name === race)
  const selectedClass = CLASSES.find((option) => option.name === className)
  const statPool = statMethod === 'standard' ? [2, 3, 4, 5, 6] : rolledValues
  const baseComplete = statPool.length === 5 && [...Object.values(baseStats)].sort((a, b) => a - b).join(',') === [...statPool].sort((a, b) => a - b).join(',')
  const levelRemaining = levelOption.statPoints - sumStats(levelStatPoints)
  const raceFlexRule = OPTION_STAT_RULES[race]?.flexible
  const classFlexRule = OPTION_STAT_RULES[className]?.flexible
  const raceFlexComplete = !raceFlexRule || sumStats(raceFlexibleStats) === raceFlexRule.points
  const classFlexComplete = !classFlexRule || sumStats(classFlexibleStats) === classFlexRule.points
  const finalStats = calculateStats(baseStats, levelStatPoints, race, className, raceFlexibleStats, classFlexibleStats)
  const visibleSkills = SKILLS.filter((option) => `${option.name} ${option.group}`.toLowerCase().includes(skillSearch.toLowerCase()))
  const canContinue = step === 0 ? Boolean(name.trim()) : step === 1 ? Boolean(race) : step === 2 ? Boolean(className) : step === 3 ? baseComplete && levelRemaining === 0 && raceFlexComplete && classFlexComplete : step === 4 ? skills.length >= levelOption.minimumSkills : true

  function selectRace(next: string) {
    setRace(next)
    setRaceFlexibleStats(emptyStatBlock())
  }

  function selectClass(next: string) {
    setClassName(next)
    setClassFlexibleStats(emptyStatBlock())
  }

  function changeStatMethod(next: 'standard' | 'manual') {
    setStatMethod(next)
    setRolledValues([])
    setBaseStats(emptyStatBlock())
  }

  function rollBaseStats() {
    setRolledValues(Array.from({ length: 5 }, rollStatDie))
    setBaseStats(emptyStatBlock())
  }

  function poolCount(value: number) {
    return statPool.filter((entry) => entry === value).length
  }

  function assignedCount(value: number, except: StatKey) {
    return STAT_KEYS.filter((key) => key !== except && baseStats[key] === value).length
  }

  function spreadLevelPoints() {
    const each = Math.floor(levelOption.statPoints / STAT_KEYS.length)
    const remainder = levelOption.statPoints % STAT_KEYS.length
    setLevelStatPoints(Object.fromEntries(STAT_KEYS.map((key, index) => [key, each + (index < remainder ? 1 : 0)])) as StatBlock)
  }

  function next() {
    if (!canContinue) {
      const message = step === 3 ? 'Assign every base score and distribute every level Stat point before continuing.' : step === 4 ? `Choose at least ${levelOption.minimumSkills} starting skills for this level.` : 'Make a selection before continuing.'
      setLocalError(message)
      return
    }
    setLocalError(null)
    setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  function toggleSkill(skill: string) {
    setLocalError(null)
    setSkills((current) => current.includes(skill) ? current.filter((entry) => entry !== skill) : current.length < 8 ? [...current, skill] : current)
  }

  function reset() {
    setStep(0); setName(''); setCrawlerNumber(500000); setCampaignId(''); setLevel(10); setRace(''); setClassName(''); setStatMethod('standard'); setRolledValues([]); setBaseStats(emptyStatBlock()); setLevelStatPoints(emptyStatBlock()); setRaceFlexibleStats(emptyStatBlock()); setClassFlexibleStats(emptyStatBlock()); setSkills([]); setSkillSearch(''); setLocalError(null)
  }

  function cancel() { reset(); onCancel() }

  async function finish() {
    setLocalError(null)
    try {
      await onCreate({ name: name.trim(), crawlerNumber, campaignId: campaignId || null, race, className, skillNames: skills, level, statMethod, rolledValues, baseStats, levelStatPoints, raceFlexibleStats, classFlexibleStats })
      reset()
    } catch (reason) {
      setLocalError(reason instanceof Error ? reason.message : 'Could not create the crawler.')
    }
  }

  return <div className="character-builder">
    <div className="modal-heading builder-heading"><div><p className="eyebrow">New crawler · Step {step + 1} of {steps.length}</p><h2>{steps[step]}</h2></div><button type="button" onClick={cancel}>×</button></div>
    <ol className="builder-steps">{steps.map((label, index) => <li key={label} className={index === step ? 'active' : index < step ? 'done' : ''}><span>{index + 1}</span>{label}</li>)}</ol>
    <div className="builder-body">
      {step === 0 ? <section className="builder-identity">
        <label>Crawler name<input value={name} required maxLength={80} onChange={(event) => setName(event.target.value)} placeholder="Your crawler's name" autoFocus /></label>
        <div className="form-grid"><label>Crawler number<input value={crawlerNumber} type="number" min={1} max={12900000} onChange={(event) => setCrawlerNumber(Number(event.target.value))} /></label><label>Campaign<select value={campaignId} onChange={(event) => setCampaignId(event.target.value)}><option value="">No campaign yet</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></label></div>
        <div className="builder-copy"><h3>Starting level</h3><p>The core rulebook provides accelerated creation packages for the Third, Fourth, and Fifth Floors.</p></div>
        <div className="level-picker">{LEVEL_OPTIONS.map((option) => <button type="button" key={option.level} className={level === option.level ? 'selected' : ''} onClick={() => { setLevel(option.level); setLevelStatPoints(emptyStatBlock()); setSkills([]) }}><strong>{option.label}</strong><span>{option.statPoints} level-up Stat points</span><p>{option.summary}</p></button>)}</div>
      </section> : null}
      {step === 1 ? <section><div className="builder-copy"><h3>Choose a race</h3><p>All 30 ready-to-play race entries are shown below, including their Stat changes and limited prerequisites.</p></div><OptionList options={RACES} selected={race} onSelect={selectRace} /></section> : null}
      {step === 2 ? <section><div className="builder-copy"><h3>Choose a class</h3><p>Browse the rulebook classes by role. Stat changes are applied automatically; your GM should confirm limited prerequisites.</p></div><OptionList options={CLASSES} selected={className} onSelect={selectClass} /></section> : null}
      {step === 3 ? <section className="stats-builder"><div className="builder-copy"><h3>Build your Stats</h3><p>Choose the standard array or roll five d6s, rerolling 1s. As requested, rolled numbers may then be assigned to any Stats.</p></div>
        <div className="stat-method-picker"><button type="button" className={statMethod === 'standard' ? 'selected' : ''} onClick={() => changeStatMethod('standard')}>Standard array <small>2, 3, 4, 5, 6</small></button><button type="button" className={statMethod === 'manual' ? 'selected' : ''} onClick={() => changeStatMethod('manual')}>Manual roll <small>5 × d6, reroll 1s</small></button></div>
        {statMethod === 'manual' ? <div className="manual-roll"><button type="button" className="primary-button" onClick={rollBaseStats}>{rolledValues.length ? 'Reroll all five' : 'Roll starting Stats'}</button>{rolledValues.length ? <div>{rolledValues.map((value, index) => <span key={index}>{value}</span>)}</div> : <p>Use the built-in roller, then assign the results below.</p>}</div> : null}
        {statPool.length === 5 ? <><div className="stat-allocation-heading"><div><strong>Assign base scores</strong><small>Each result can be used only as many times as it appears.</small></div></div><div className="base-stat-grid">{STAT_KEYS.map((key) => <label key={key}>{abbreviations[key]}<select value={baseStats[key] || ''} onChange={(event) => setBaseStats({ ...baseStats, [key]: Number(event.target.value) })}><option value="">Choose…</option>{[...new Set(statPool)].map((value) => <option key={value} value={value} disabled={baseStats[key] !== value && assignedCount(value, key) >= poolCount(value)}>{value}</option>)}</select></label>)}</div></> : null}
        <div className="stat-allocation-heading"><div><strong>Distribute level points</strong><small>{levelOption.label} grants {levelOption.statPoints} points.</small></div><div><b className={levelRemaining < 0 ? 'over' : ''}>{levelRemaining} remaining</b><button type="button" className="text-button" onClick={spreadLevelPoints}>Spread evenly</button><button type="button" className="text-button" onClick={() => setLevelStatPoints(emptyStatBlock())}>Reset</button></div></div>
        <div className="level-stat-grid">{STAT_KEYS.map((key) => <label key={key}>{abbreviations[key]}<input type="number" min={0} max={levelOption.statPoints} value={levelStatPoints[key]} onChange={(event) => setLevelStatPoints({ ...levelStatPoints, [key]: Math.max(0, Math.min(levelOption.statPoints, Number(event.target.value))) })} /></label>)}</div>
        <FlexibleAllocation source={race} value={raceFlexibleStats} onChange={setRaceFlexibleStats} />
        <FlexibleAllocation source={className} value={classFlexibleStats} onChange={setClassFlexibleStats} />
        <div className="stat-breakdown"><div className="stat-breakdown-head"><span>Stat</span><span>Base</span><span>Level</span><span>Race</span><span>Class</span><span>Final</span></div>{STAT_KEYS.map((key) => { const raceBonus = (OPTION_STAT_RULES[race]?.fixed?.[key] ?? 0) + raceFlexibleStats[key]; const classBonus = (OPTION_STAT_RULES[className]?.fixed?.[key] ?? 0) + classFlexibleStats[key]; return <div key={key}><strong>{abbreviations[key]}</strong><span>{baseStats[key] || '—'}</span><span>+{levelStatPoints[key]}</span><span>{raceBonus >= 0 ? '+' : ''}{raceBonus}</span><span>{classBonus >= 0 ? '+' : ''}{classBonus}</span><b>{finalStats[key]} <small>+{modifier(finalStats[key])} mod</small></b></div> })}</div>
        {OPTION_STAT_RULES[race]?.caps ? <p className="form-note">A racial Stat cap is applied after all creation bonuses. Points above the cap are lost.</p> : null}
      </section> : null}
      {step === 4 ? <section><div className="builder-copy"><h3>Choose starting skills</h3><p>{levelOption.summary} Select at least {levelOption.minimumSkills} skills to place on the initial digital sheet; background, experience, and rank rolls can still be refined while editing.</p></div>
        <label className="builder-search">Search skills<input value={skillSearch} onChange={(event) => setSkillSearch(event.target.value)} placeholder="Search attack and utility skills…" /></label>
        <div className="skill-counter">{skills.length} / 8 chosen <small>Minimum {levelOption.minimumSkills}</small></div>
        <div className="builder-options skill-options">{visibleSkills.map((option) => <button type="button" key={option.name} className={skills.includes(option.name) ? 'selected' : ''} onClick={() => toggleSkill(option.name)} disabled={!skills.includes(option.name) && skills.length >= 8}><span><strong>{option.name}</strong><em>{option.group} · p. {option.page}</em></span><p>{option.summary}</p></button>)}</div>
      </section> : null}
      {step === 5 ? <section><div className="builder-copy"><h3>Review your crawler</h3><p>You can edit every field and add character art after creation.</p></div><div className="builder-review">
        <article><small>Crawler</small><strong>{name}</strong><p>#{crawlerNumber.toLocaleString()} · {levelOption.label}</p></article>
        <article><small>Race</small><strong>{race}</strong><p>{selectedRace?.summary}</p></article>
        <article><small>Class</small><strong>{className}</strong><p>{selectedClass?.summary}</p></article>
        <article><small>Final Stats</small><div>{STAT_KEYS.map((key) => <span key={key}>{abbreviations[key]} {finalStats[key]}</span>)}</div><p>Popularity {modifier(finalStats.charisma) * (level === 10 ? 2 : 3)} · Mana {finalStats.intelligence}</p></article>
        <article className="wide"><small>Starting skills</small><div>{skills.map((skill) => <span key={skill}>{skill}</span>)}</div></article>
      </div>{selectedRace?.requirement || selectedClass?.requirement ? <p className="form-note">Limited selections: {[selectedRace?.requirement, selectedClass?.requirement].filter(Boolean).join(' · ')} Confirm these with your GM.</p> : null}</section> : null}
    </div>
    {localError ? <div className="auth-error builder-error">{localError}</div> : null}
    <div className="modal-actions builder-actions"><button type="button" className="ghost-button" onClick={step ? () => setStep((current) => current - 1) : cancel}>{step ? 'Back' : 'Cancel'}</button>{step < steps.length - 1 ? <button type="button" className="primary-button" onClick={next} disabled={!canContinue}>Continue</button> : <button type="button" className="primary-button" onClick={() => void finish()} disabled={saving}>{saving ? 'Creating…' : 'Create crawler'}</button>}</div>
  </div>
}
