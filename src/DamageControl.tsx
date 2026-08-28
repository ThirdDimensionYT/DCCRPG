import { useMemo, useState, type FormEvent } from 'react'
import { calculateDamage, DAMAGE_TYPES, type DamageCalculation, type DamageExposure, type DamageInput, type DamageResponse } from '../shared/damage'
import type { Character, CharacterSheetData } from './api'

type AppliedDamage = DamageCalculation & { slotsMarked: number; healthSlotsLost: number; dying: boolean }

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

export default function DamageControl({ character, sheet, saving, onApply }: {
  character: Character
  sheet: CharacterSheetData
  saving: boolean
  onApply: (input: DamageInput) => Promise<AppliedDamage>
}) {
  const [amount, setAmount] = useState(0)
  const [damageType, setDamageType] = useState<DamageInput['damageType']>('Bludgeoning')
  const [exposure, setExposure] = useState<DamageExposure>('full')
  const [response, setResponse] = useState<DamageResponse>('normal')
  const [ignoreDr, setIgnoreDr] = useState(false)
  const [applied, setApplied] = useState<AppliedDamage | null>(null)
  const dr = Math.max(0, sheet.armor + sheet.armorBuffs)
  const slotValue = statModifier(character.constitution)
  const input = useMemo<DamageInput>(() => ({ amount, damageType, exposure, response, ignoreDr }), [amount, damageType, exposure, response, ignoreDr])
  const preview = useMemo(() => calculateDamage(input, dr, slotValue), [input, dr, slotValue])

  async function submit(event: FormEvent) {
    event.preventDefault()
    const result = await onApply(input)
    setApplied(result)
  }

  return <form className="damage-control" onSubmit={(event) => void submit(event)}>
    <div className="damage-control-heading"><div><p className="eyebrow">Rulebook pp. 92–94</p><h4>Apply incoming damage</h4></div><a href="/api/rulebook#page=96" target="_blank" rel="noreferrer">Damage rules ↗</a></div>
    <div className="damage-fields">
      <label>Damage dealt<input type="number" min="0" max="99999" value={amount} onChange={(event) => setAmount(Math.max(0,Number(event.target.value)))} /></label>
      <label>Damage type<select value={damageType} onChange={(event) => setDamageType(event.target.value as DamageInput['damageType'])}>{DAMAGE_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
      <label>Area result<select value={exposure} onChange={(event) => setExposure(event.target.value as DamageExposure)}><option value="full">Full damage</option><option value="evaded-area">Area Evaded · half</option><option value="splash">Splash · half</option><option value="evaded-splash">Splash Evaded · quarter</option></select></label>
      <label>Element response<select value={response} onChange={(event) => setResponse(event.target.value as DamageResponse)}><option value="normal">Normal</option><option value="resistant">Resistance · half</option><option value="vulnerable">Vulnerability · double</option><option value="immune">Immunity · zero</option></select></label>
    </div>
    <label className="damage-check"><input type="checkbox" checked={ignoreDr} onChange={(event) => setIgnoreDr(event.target.checked)} /> Ignore DR <small>Use for damage that explicitly bypasses DR, such as damage-dealing Debuffs.</small></label>
    <div className="damage-preview"><span><small>After Area result</small><strong>{preview.exposureDamage}</strong></span><span><small>DR applied</small><strong>−{preview.drApplied}</strong></span><span><small>Final damage</small><strong>{preview.finalDamage}</strong></span><span><small>HB result</small><strong>{preview.slotsLost} slot{preview.slotsLost === 1 ? '' : 's'}</strong></span></div>
    <p className="damage-explanation">Each Health Bar slot is worth {slotValue} from the CON modifier. Partial-slot damage is discarded.</p>
    {applied ? <div className={applied.dying ? 'damage-applied dying' : 'damage-applied'}>{applied.slotsMarked ? `${applied.slotsMarked} Health Bar slot${applied.slotsMarked === 1 ? '' : 's'} marked.` : 'No Health Bar slots were lost.'}{applied.dying ? ' This crawler is now DYING.' : ''}</div> : null}
    <button className="damage-button" disabled={saving || !amount || character.health_slots_lost === 10}>{saving ? 'Applying…' : 'Apply damage'}</button>
  </form>
}
