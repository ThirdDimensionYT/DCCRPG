import { useEffect, useRef, useState } from 'react'
import { DICE_SIDES, rollDie, type DiceSides, type RollMode } from './dice'

type RollResult = { id: string; notation: string; rolls: number[]; kept: number[]; total: number; mode: RollMode; time: string }

export default function DiceRoller() {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(1)
  const [sides, setSides] = useState<DiceSides>(20)
  const [modifier, setModifier] = useState(0)
  const [mode, setMode] = useState<RollMode>('normal')
  const [history, setHistory] = useState<RollResult[]>([])
  const [rolling, setRolling] = useState(false)
  const timer = useRef<number | null>(null)
  const checkModeAvailable = sides === 20 && count === 1
  const latest = history[0]

  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current) }, [])

  function chooseSides(next: DiceSides) {
    setSides(next)
    if (next !== 20 || count !== 1) setMode('normal')
  }

  function chooseCount(next: number) {
    setCount(next)
    if (next !== 1) setMode('normal')
  }

  function roll() {
    if (rolling) return
    setRolling(true)
    timer.current = window.setTimeout(() => {
      const rollCount = checkModeAvailable && mode !== 'normal' ? 2 : count
      const rolls = Array.from({ length: rollCount }, () => rollDie(sides))
      const kept = mode === 'advantage' ? [Math.max(...rolls)] : mode === 'disadvantage' ? [Math.min(...rolls)] : rolls
      const total = kept.reduce((sum, value) => sum + value, 0) + modifier
      const notation = mode === 'normal' ? `${count}d${sides}${modifier ? modifier > 0 ? `+${modifier}` : modifier : ''}` : `1d20 ${mode}${modifier ? modifier > 0 ? ` +${modifier}` : ` ${modifier}` : ''}`
      setHistory((current) => [{ id: crypto.randomUUID(), notation, rolls, kept, total, mode, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...current].slice(0, 12))
      setRolling(false)
      timer.current = null
    }, 520)
  }

  return <aside className={`dice-drawer ${open ? 'open' : ''}`} aria-label="Dice roller">
    {open ? <section className="dice-drawer-panel">
      <header><div><p className="eyebrow">Always-on crawler tool</p><h3>Dice roller</h3></div><button type="button" onClick={() => setOpen(false)} aria-label="Close dice roller">×</button></header>
      <div className={`animated-die die-shape die-d${sides} ${rolling ? 'rolling' : ''}`} aria-live="polite"><span>{rolling ? '?' : latest?.total ?? sides}</span><small>{rolling ? 'Rolling…' : latest?.notation ?? `d${sides}`}</small></div>
      <div className="compact-dice-controls"><label>Dice<input type="number" min={1} max={20} value={count} onChange={(event) => chooseCount(Math.max(1, Math.min(20, Number(event.target.value))))} /></label><label>Modifier<input type="number" min={-999} max={999} value={modifier} onChange={(event) => setModifier(Math.max(-999, Math.min(999, Number(event.target.value))))} /></label></div>
      <div className="die-picker compact">{DICE_SIDES.map((die) => <button type="button" key={die} className={sides === die ? 'selected' : ''} onClick={() => chooseSides(die)}>d{die}</button>)}</div>
      <div className="roll-mode compact"><button type="button" className={mode === 'normal' ? 'selected' : ''} onClick={() => setMode('normal')}>Normal</button><button type="button" className={mode === 'advantage' ? 'selected' : ''} disabled={!checkModeAvailable} onClick={() => setMode('advantage')}>Adv</button><button type="button" className={mode === 'disadvantage' ? 'selected' : ''} disabled={!checkModeAvailable} onClick={() => setMode('disadvantage')}>Dis</button></div>
      <button type="button" className="primary-button drawer-roll" onClick={roll} disabled={rolling}>{rolling ? 'Rolling…' : `Roll ${mode === 'normal' ? `${count}d${sides}` : mode}`}</button>
      {history.length ? <div className="compact-roll-history"><div><strong>Recent rolls</strong><button type="button" onClick={() => setHistory([])}>Clear</button></div>{history.slice(0, 5).map((result) => <article key={result.id}><b>{result.total}</b><span>{result.notation}<small>Rolled {result.rolls.join(', ')}{result.mode !== 'normal' ? ` · kept ${result.kept[0]}` : ''}</small></span><time>{result.time}</time></article>)}</div> : null}
    </section> : null}
    <button type="button" className={`dice-fab ${rolling ? 'rolling' : ''}`} onClick={() => setOpen((current) => !current)} aria-expanded={open}><span className={`mini-die die-shape die-d${sides}`}>{sides === 100 ? '%' : sides}</span><strong>{latest ? latest.total : `Roll d${sides}`}</strong></button>
  </aside>
}
