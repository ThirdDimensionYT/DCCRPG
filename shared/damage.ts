export const DAMAGE_TYPES = ['Acid','Bludgeoning','Electric','Fire','Force','Holy','Ice','Necrotic','Piercing','Poison','Psychic','Slashing','Sonic'] as const

export type DamageType = typeof DAMAGE_TYPES[number]
export type DamageExposure = 'full' | 'evaded-area' | 'splash' | 'evaded-splash'
export type DamageResponse = 'normal' | 'resistant' | 'vulnerable' | 'immune'

export type DamageInput = {
  amount: number
  damageType: DamageType
  exposure: DamageExposure
  response: DamageResponse
  ignoreDr: boolean
}

export type DamageCalculation = {
  incoming: number
  exposureDamage: number
  drApplied: number
  afterDr: number
  finalDamage: number
  slotValue: number
  slotsLost: number
}

export function calculateDamage(input: DamageInput, dr: number, slotValue: number): DamageCalculation {
  const exposureMultiplier = input.exposure === 'evaded-splash' ? 0.25 : input.exposure === 'full' ? 1 : 0.5
  const exposureDamage = Math.floor(input.amount * exposureMultiplier)
  const drApplied = input.ignoreDr ? 0 : Math.min(Math.max(0, dr), exposureDamage)
  const afterDr = Math.max(0, exposureDamage - drApplied)
  const responseMultiplier = input.response === 'immune' ? 0 : input.response === 'resistant' ? 0.5 : input.response === 'vulnerable' ? 2 : 1
  const finalDamage = Math.floor(afterDr * responseMultiplier)
  return {
    incoming: input.amount,
    exposureDamage,
    drApplied,
    afterDr,
    finalDamage,
    slotValue,
    slotsLost: Math.floor(finalDamage / Math.max(1, slotValue)),
  }
}
