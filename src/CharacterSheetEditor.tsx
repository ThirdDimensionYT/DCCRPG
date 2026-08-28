import { useMemo, useState, type FormEvent } from 'react'
import { emptyCharacterSheetData, parseCharacterSheetData, type Character, type CharacterSheetData, type CharacterUpdate, type SheetRow } from './api'

type Tab = 'core' | 'attacks' | 'loadout' | 'skills' | 'inventory'
type RowSection = 'attacks' | 'hotlist' | 'skills' | 'inventory'

const tabs: Array<[Tab, string]> = [
  ['core', 'Core'], ['attacks', 'Attacks'], ['loadout', 'Hotlist & gear'], ['skills', 'Skills'], ['inventory', 'Inventory'],
]
const stats = [['strength','STR'],['intelligence','INT'],['constitution','CON'],['dexterity','DEX'],['charisma','CHA']] as const

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

function cloneSheet(character: Character): CharacterSheetData {
  const parsed = parseCharacterSheetData(character.sheet_data)
  return {
    ...emptyCharacterSheetData, ...parsed,
    externalBuffs: [...parsed.externalBuffs], unenhancedStats: { ...parsed.unenhancedStats }, gear: { ...parsed.gear },
    attacks: parsed.attacks.map((row) => ({ ...row })), hotlist: parsed.hotlist.map((row) => ({ ...row })),
    skills: parsed.skills.map((row) => ({ ...row })), inventory: parsed.inventory.map((row) => ({ ...row })),
    advancementLog: parsed.advancementLog.map((entry) => ({ ...entry, statPoints: { ...entry.statPoints }, automaticEffects: [...entry.automaticEffects] })),
    unlockedFeatures: parsed.unlockedFeatures.map((feature) => ({ ...feature })),
  }
}

function asText(value: FormDataEntryValue | null) { return String(value ?? '') }
function asNumber(value: FormDataEntryValue | null) { return Number(value ?? 0) }

function RowEditor({ rows, columns, onChange, onAdd, onRemove }: {
  rows: SheetRow[]
  columns: Array<{ key: string; label: string; type?: 'text' | 'number' | 'checkbox'; wide?: boolean }>
  onChange: (index: number, key: string, value: string | number | boolean) => void
  onAdd: () => void
  onRemove: (index: number) => void
}) {
  const columnsStyle = `${columns.map((column) => column.wide ? 'minmax(140px,2fr)' : 'minmax(74px,1fr)').join(' ')} 30px`
  return <div className="sheet-row-editor">
    <div className="sheet-table-head" style={{ gridTemplateColumns: columnsStyle }}>{columns.map((column) => <span key={column.key}>{column.label}</span>)}<span /></div>
    {rows.map((row, index) => <div className="sheet-table-row" style={{ gridTemplateColumns: columnsStyle }} key={index}>
      {columns.map((column) => <label key={column.key}><small>{column.label}</small>{column.type === 'checkbox' ? <input type="checkbox" checked={Boolean(row[column.key])} onChange={(event) => onChange(index,column.key,event.target.checked)} /> : <input type={column.type ?? 'text'} value={String(row[column.key] ?? '')} onChange={(event) => onChange(index,column.key,column.type === 'number' ? Number(event.target.value) : event.target.value)} />}</label>)}
      <button type="button" className="remove-row" onClick={() => onRemove(index)} aria-label={`Remove row ${index + 1}`}>×</button>
    </div>)}
    <button type="button" className="ghost-button add-row" onClick={onAdd}>+ Add row</button>
  </div>
}

export default function CharacterSheetEditor({ character, saving, isAdmin, onCancel, onSave }: {
  character: Character; saving: boolean; isAdmin: boolean; onCancel: () => void
  onSave: (update: CharacterUpdate, art: File | null) => Promise<void>
}) {
  const [tab, setTab] = useState<Tab>('core')
  const [sheet, setSheet] = useState(() => cloneSheet(character))
  const [healthLost, setHealthLost] = useState(character.health_slots_lost)
  const owner = useMemo(() => isAdmin ? `Player: ${character.owner_display_name} (@${character.owner_username})` : 'Your character', [character,isAdmin])

  function changeRow(section: RowSection, index: number, key: string, value: string | number | boolean) {
    setSheet((current) => ({ ...current, [section]: current[section].map((row,rowIndex) => rowIndex === index ? { ...row, [key]: value } : row) }))
  }
  function addRow(section: RowSection, row: SheetRow) { setSheet((current) => ({ ...current, [section]: [...current[section], row] })) }
  function removeRow(section: RowSection, index: number) { setSheet((current) => ({ ...current, [section]: current[section].filter((_,rowIndex) => rowIndex !== index) })) }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const art = form.get('art')
    await onSave({
      name: asText(form.get('name')), crawlerNumber: asNumber(form.get('crawlerNumber')), race: asText(form.get('race')),
      className: asText(form.get('className')), genderPronouns: asText(form.get('genderPronouns')), level: asNumber(form.get('level')),
      floor: character.floor, strength: asNumber(form.get('strength')), intelligence: asNumber(form.get('intelligence')),
      constitution: asNumber(form.get('constitution')), dexterity: asNumber(form.get('dexterity')), charisma: asNumber(form.get('charisma')),
      aiFavor: asNumber(form.get('aiFavor')), popularity: character.popularity, sizeName: asText(form.get('sizeName')),
      sizeValue: asNumber(form.get('sizeValue')), move: asNumber(form.get('move')), step: asNumber(form.get('step')),
      currentMana: character.current_mana, healthSlotsLost: healthLost,
      pastTrauma: character.past_trauma, looseEnd: character.loose_end, regret: character.regret, notes: character.notes, sheetData: sheet,
    }, art instanceof File && art.size ? art : null)
  }

  return <form key={character.id} onSubmit={(event) => void submit(event)}>
    <div className="modal-heading sheet-editor-heading"><div><p className="eyebrow">Portrait sheet · reference pages 4–21</p><h2>{character.name}</h2><small>{owner}</small></div><div><button type="button" className="ghost-button print-button" onClick={() => window.print()}>Print</button><button type="button" className="editor-close" onClick={onCancel}>×</button></div></div>
    <nav className="sheet-editor-tabs" aria-label="Character sheet sections">{tabs.map(([id,label]) => <button type="button" key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}</nav>

    <section className="sheet-editor-section" hidden={tab !== 'core'}><h3>Identity & status</h3>
      <div className="form-grid three"><label>Name<input name="name" required maxLength={80} defaultValue={character.name} /></label><label>Race<input name="race" value={character.race} readOnly /><small>Race benefits are linked to this selection.</small></label><label>Gender / pronouns<input name="genderPronouns" maxLength={80} defaultValue={character.gender_pronouns} /></label><label>Level<input name="level" type="number" value={character.level} readOnly /><small>Use Level Up on the character sheet to increase this safely.</small></label><label>Crawler number<input name="crawlerNumber" type="number" min="1" max="12900000" defaultValue={character.crawler_number} /></label><label>Class<input name="className" value={character.class_name} readOnly /><small>Class benefits are linked to this selection.</small></label></div>
      <div className="health-editor"><div><strong>Health</strong><small>{10-healthLost}/10 segments</small></div><input aria-label="Health segments remaining" type="range" min="0" max="10" value={10-healthLost} onChange={(event) => setHealthLost(10-Number(event.target.value))} /><div className="health-segments">{Array.from({length:10},(_,index) => <span className={index >= 10-healthLost ? 'lost' : ''} key={index}>{(index+1)*10}%</span>)}</div></div>
      <h3>Evade & damage resistance</h3><div className="derived-totals"><article><small>DEX modifier</small><strong>+{statModifier(character.dexterity)}</strong></article><article><small>Evade total</small><strong>{statModifier(character.dexterity)+sheet.evadeBuffs}</strong></article><article><small>DR total</small><strong>{sheet.armor+sheet.armorBuffs}</strong></article></div><div className="form-grid three"><label>Evade buffs<input type="number" value={sheet.evadeBuffs} onChange={(e) => setSheet({...sheet,evadeBuffs:Number(e.target.value)})} /></label><label>Move<input name="move" type="number" min="0" max="9999" defaultValue={character.move} /></label><label>Step<input name="step" type="number" min="0" max="9999" defaultValue={character.step} /></label><label>Armor<input type="number" value={sheet.armor} onChange={(e) => setSheet({...sheet,armor:Number(e.target.value)})} /></label><label>Armor buffs<input type="number" value={sheet.armorBuffs} onChange={(e) => setSheet({...sheet,armorBuffs:Number(e.target.value)})} /></label><label>AI favor<input name="aiFavor" type="number" min="0" max="999" defaultValue={character.ai_favor} /></label><label>Size<input name="sizeName" required maxLength={40} defaultValue={character.size_name} /></label><label>Size value<input name="sizeValue" type="number" min="0" max="999" defaultValue={character.size_value} /></label></div>
      <h3>Core stats</h3><div className="enhanced-stat-grid">{stats.map(([key,label]) => <article key={key}><strong>{label}</strong><label>Enhanced<input name={key} type="number" min="1" max="999" defaultValue={character[key]} /></label><label>Unenhanced<input type="number" min="1" max="999" value={sheet.unenhancedStats[key]} onChange={(e) => setSheet({...sheet,unenhancedStats:{...sheet.unenhancedStats,[key]:Number(e.target.value)}})} /></label></article>)}</div>
      <h3>External buffs</h3><div className="form-grid three">{sheet.externalBuffs.map((buff,index) => <label key={index}>Buff {index+1}<input value={buff} onChange={(e) => setSheet({...sheet,externalBuffs:sheet.externalBuffs.map((value,i) => i === index ? e.target.value : value)})} /></label>)}</div>
      <label className="portrait-upload">Character portrait<input name="art" type="file" accept="image/jpeg,image/png,image/webp" /><small>JPG, PNG, or WebP · maximum 5 MB</small></label>
    </section>

    <section className="sheet-editor-section" hidden={tab !== 'attacks'}><h3>Attacks</h3><RowEditor rows={sheet.attacks} columns={[{key:'name',label:'Name',wide:true},{key:'rank',label:'Rank',type:'number'},{key:'toHitStat',label:'To-hit stat'},{key:'toHitMod',label:'To-hit mod'},{key:'dice',label:'Dice'},{key:'damageStat',label:'Damage stat'},{key:'damageMod',label:'Damage mod'},{key:'effects',label:'Effects',wide:true}]} onChange={(...args) => changeRow('attacks',...args)} onAdd={() => addRow('attacks',{name:'',rank:0,toHitStat:'',toHitMod:'',dice:'',damageStat:'',damageMod:'',effects:''})} onRemove={(index) => removeRow('attacks',index)} /></section>

    <section className="sheet-editor-section" hidden={tab !== 'loadout'}><h3>Hotlist</h3><RowEditor rows={sheet.hotlist} columns={[{key:'entry',label:'Spell, skill, item, or action',wide:true}]} onChange={(...args) => changeRow('hotlist',...args)} onAdd={() => addRow('hotlist',{entry:''})} onRemove={(index) => removeRow('hotlist',index)} /><h3>Gear slots, tattoos & patches</h3><div className="gear-editor">{Object.entries(sheet.gear).map(([key,value]) => <label key={key}>{key === 'hands' ? 'Hands / holding' : key}<textarea rows={key === 'accessories' ? 7 : key === 'hands' ? 4 : 3} value={value} onChange={(e) => setSheet({...sheet,gear:{...sheet.gear,[key]:e.target.value}})} /></label>)}</div></section>

    <section className="sheet-editor-section" hidden={tab !== 'skills'}><h3>Skills</h3><RowEditor rows={sheet.skills} columns={[{key:'name',label:'Name',wide:true},{key:'rank',label:'Rank',type:'number'},{key:'statMod',label:'Stat & mod'},{key:'checkType',label:'Check type'},{key:'notes',label:'Notes & upgrades',wide:true},{key:'advanced',label:'✓',type:'checkbox'}]} onChange={(...args) => changeRow('skills',...args)} onAdd={() => addRow('skills',{name:'',rank:0,statMod:'',checkType:'',notes:'',advanced:false})} onRemove={(index) => removeRow('skills',index)} /></section>

    <section className="sheet-editor-section" hidden={tab !== 'inventory'}><h3>Inventory</h3><RowEditor rows={sheet.inventory} columns={[{key:'item',label:'Item',wide:true},{key:'quantity',label:'Quantity',type:'number'},{key:'notes',label:'Notes',wide:true}]} onChange={(...args) => changeRow('inventory',...args)} onAdd={() => addRow('inventory',{item:'',quantity:1,notes:''})} onRemove={(index) => removeRow('inventory',index)} /></section>
    <div className="modal-actions sticky"><button type="button" className="ghost-button" onClick={onCancel}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save complete sheet'}</button></div>
  </form>
}
