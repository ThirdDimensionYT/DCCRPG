export const DICE_SIDES = [2, 3, 4, 6, 8, 10, 12, 20, 100] as const
export type DiceSides = typeof DICE_SIDES[number]
export type RollMode = 'normal' | 'advantage' | 'disadvantage'

export function rollDie(sides: number): number {
  if (!Number.isInteger(sides) || sides < 2 || sides > 1000) throw new Error('Invalid die size.')
  const range = 0x1_0000_0000
  const ceiling = Math.floor(range / sides) * sides
  const value = new Uint32Array(1)
  do crypto.getRandomValues(value)
  while (value[0] >= ceiling)
  return (value[0] % sides) + 1
}

export function rollStatDie(): number {
  let result = rollDie(6)
  while (result === 1) result = rollDie(6)
  return result
}
