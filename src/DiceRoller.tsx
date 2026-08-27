import { useState } from 'react'
import { DICE_SIDES, rollDie, type DiceSides, type RollMode } from './dice'

type RollResult = { id: string; notation: string; rolls: number[]; kept: number[]; modifier: number; total: number; mode: RollMode; time: string }

export default function DiceRoller() {
  const [count, setCount] = useState(1)
  const [sides, setSides] = useState<DiceSides>(20)
  const [modifier, setModifier] = useState(0)
  const [mode, setMode] = useState<RollMode>('normal')
  const [history, setHistory] = useState<RollResult[]>([])
  const checkModeAvailable = sides === 20 && count === 1

  function chooseSides(next: DiceSides) {
    setSides(next)
    if (next !== 20 || count !== 1) setMode('normal')
  }

  function chooseCount(next: number) {
    setCount(next)
    if (next !== 1) setMode('normal')
  }

  function roll() {
    const rollCount = checkModeAvailable && mode !== 'normal' ? 2 : count
    const rolls = Array.from({ length: rollCount }, () => rollDie(sides))
    const kept = mode === 'advantage' ? [Math.max(...rolls)] : mode === 'disadvantage' ? [Math.min(...rolls)] : rolls
    const total = kept.reduce((sum, value) => sum + value, 0) + modifier
    const notation = mode === 'normal' ? `${count}d${sides}${modifier ? modifier > 0 ? `+${modifier}` : modifier : ''}` : `1d20 ${mode}${modifier ? modifier > 0 ? ` +${modifier}` : ` ${modifier}` : ''}`
    setHistory((current) => [{ id: crypto.randomUUID(), notation, rolls, kept, modifier, total, mode, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...current].slice(0, 30))
  }

  return <div className="content dice-page">
    <section className="section-intro"><div><p className="eyebrow">Crawler tools</p><h2>Dice roller</h2><p>Roll every standard die used by the game. Advantage and Disadvantage apply to single d20 Checks.</p></div></section>
    <div className="dice-layout">
      <section className="panel dice-controls">
        <div className="panel-heading"><div><p className="eyebrow">Build a roll</p><h3>{count}d{sides}</h3></div></div>
        <label>Number of dice<input type="number" min={1} max={20} value={count} onChange={(event) => chooseCount(Math.max(1, Math.min(20, Number(event.target.value))))} /></label>
        <fieldset><legend>Die</legend><div className="die-picker">{DICE_SIDES.map((die) => <button type="button" key={die} className={sides === die ? 'selected' : ''} onClick={() => chooseSides(die)}>d{die}</button>)}</div></fieldset>
        <label>Modifier<input type="number" min={-999} max={999} value={modifier} onChange={(event) => setModifier(Math.max(-999, Math.min(999, Number(event.target.value))))} /></label>
        <fieldset><legend>d20 mode</legend><div className="roll-mode"><button type="button" className={mode === 'normal' ? 'selected' : ''} onClick={() => setMode('normal')}>Normal</button><button type="button" className={mode === 'advantage' ? 'selected' : ''} disabled={!checkModeAvailable} onClick={() => setMode('advantage')}>Advantage</button><button type="button" className={mode === 'disadvantage' ? 'selected' : ''} disabled={!checkModeAvailable} onClick={() => setMode('disadvantage')}>Disadvantage</button></div><small>Advantage keeps the higher of 2d20; Disadvantage keeps the lower. They do not stack.</small></fieldset>
        <button className="primary-button roll-button" onClick={roll}>Roll {mode === 'normal' ? `${count}d${sides}` : `with ${mode}`}</button>
      </section>
      <section className="panel dice-history">
        <div className="panel-heading"><div><p className="eyebrow">This session</p><h3>Roll history</h3></div>{history.length ? <button className="text-button" onClick={() => setHistory([])}>Clear</button> : null}</div>
        {history.length ? <div className="roll-list">{history.map((result, index) => <article key={result.id} className={index === 0 ? 'latest' : ''}><div><strong>{result.total}</strong><span>{result.notation}</span></div><p>Rolled {result.rolls.join(', ')}{result.mode !== 'normal' ? ` · kept ${result.kept[0]}` : ''}</p><time>{result.time}</time></article>)}</div> : <div className="empty-state dice-empty"><div>⚄</div><h3>No rolls yet</h3><p>Your latest 30 rolls will stay here until the page is refreshed.</p></div>}
      </section>
    </div>
  </div>
}
