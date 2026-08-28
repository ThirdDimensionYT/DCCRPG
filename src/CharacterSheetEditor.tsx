import { useMemo, useState, type FormEvent } from 'react'
import { ITEM_CATALOG, SPELL_BY_ID, SPELL_CATALOG, type InventoryCatalogEntry } from '../shared/catalog'
import { emptyCharacterSheetData, parseCharacterSheetData, type Character, type CharacterSheetData, type CharacterUpdate, type ManagedInventoryItem, type ManagedSpell, type SheetRow } from './api'

type Tab = 'core' | 'attacks' | 'loadout' | 'skills' | 'spells' | 'inventory'
type RowSection = 'attacks' | 'hotlist' | 'skills' | 'inventory'

const tabs: Array<[Tab, string]> = [
  ['core', 'Core'], ['attacks', 'Custom attacks'], ['loadout', 'Hotlist & gear'], ['skills', 'Skills'], ['spells', 'Manage Spells'], ['inventory', 'Manage Inventory'],
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
    spells: parsed.spells.map((spell) => ({ ...spell })), managedInventory: parsed.managedInventory.map((item) => ({ ...item })),
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
  const [selectedSpellId, setSelectedSpellId] = useState(SPELL_CATALOG.find((entry) => entry.id !== 'heal')?.id ?? 'heal')
  const [selectedItemId, setSelectedItemId] = useState(ITEM_CATALOG[0]?.id ?? '')
  const owner = useMemo(() => isAdmin ? `Player: ${character.owner_display_name} (@${character.owner_username})` : 'Your character', [character,isAdmin])
  const hotlistCount = sheet.hotlist.filter((row) => String(row.entry ?? '').trim()).length + sheet.spells.filter((spell) => spell.hotlisted).length + sheet.managedInventory.filter((item) => item.hotlisted).length

  function changeRow(section: RowSection, index: number, key: string, value: string | number | boolean) {
    setSheet((current) => ({ ...current, [section]: current[section].map((row,rowIndex) => rowIndex === index ? { ...row, [key]: value } : row) }))
  }
  function addRow(section: RowSection, row: SheetRow) { setSheet((current) => ({ ...current, [section]: [...current[section], row] })) }
  function removeRow(section: RowSection, index: number) { setSheet((current) => ({ ...current, [section]: current[section].filter((_,rowIndex) => rowIndex !== index) })) }

  function addSpell() {
    const catalogEntry = SPELL_BY_ID.get(selectedSpellId)
    if (!catalogEntry || sheet.spells.some((spell) => spell.catalogId === selectedSpellId)) return
    const skillRank = character.skills.find((skill) => skill.name === catalogEntry.name)?.rank ?? 1
    const next: ManagedSpell = { id: crypto.randomUUID(), catalogId: selectedSpellId, rank: skillRank, hotlisted: false, notes: '' }
    setSheet((current) => ({ ...current, spells: [...current.spells, next] }))
  }

  function changeSpell(id: string, patch: Partial<ManagedSpell>) {
    setSheet((current) => ({ ...current, spells: current.spells.map((spell) => spell.id === id ? { ...spell, ...patch } : spell) }))
  }

  function addInventoryItem() {
    const catalogEntry = ITEM_CATALOG.find((entry) => entry.id === selectedItemId)
    if (!catalogEntry) return
    const existing = sheet.managedInventory.find((item) => item.catalogId === selectedItemId)
    if (existing) {
      setSheet((current) => ({ ...current, managedInventory: current.managedInventory.map((item) => item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item) }))
      return
    }
    const skillRank = character.skills.find((skill) => skill.name === catalogEntry.name || (catalogEntry.id === 'improvised-weapons' && skill.name === 'Improvised Weapons'))?.rank ?? 1
    const next: ManagedInventoryItem = { id: crypto.randomUUID(), catalogId: selectedItemId, quantity: 1, equipped: false, hotlisted: false, rank: skillRank, notes: '' }
    setSheet((current) => ({ ...current, managedInventory: [...current.managedInventory, next] }))
  }

  function changeInventoryItem(id: string, patch: Partial<ManagedInventoryItem>) {
    setSheet((current) => ({ ...current, managedInventory: current.managedInventory.map((item) => item.id === id ? { ...item, ...patch } : item) }))
  }

  function catalogOption(entry: InventoryCatalogEntry) {
    const damage = entry.attack ? ' · ' + (entry.attack.baseDice ?? 0) + 'd' + (entry.attack.dieSides ?? '—') + ' ' + (entry.attack.damageType ?? '') : ''
    return entry.name + ' · ' + entry.category + damage
  }

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

    <section className="sheet-editor-section" hidden={tab !== 'spells'}>
      <div className="manager-heading"><div><p className="eyebrow">Rulebook catalogue</p><h3>Manage Spells</h3><p>Add known Spells, set their Rank, and choose which ones occupy your 10-slot Hotlist.</p></div><span className="count-badge">{sheet.spells.length} known</span></div>
      <div className="catalog-add"><label>Choose a Spell<select value={selectedSpellId} onChange={(event) => setSelectedSpellId(event.target.value)}>{SPELL_CATALOG.map((entry) => <option key={entry.id} value={entry.id}>{entry.name + ' · ' + entry.category + ' · ' + (entry.manaCost === null ? 'No Mana' : entry.manaCost + ' Mana')}</option>)}</select></label><button type="button" className="primary-button" onClick={addSpell} disabled={sheet.spells.some((spell) => spell.catalogId === selectedSpellId)}>Add Spell</button></div>
      <div className="managed-entry-list">{sheet.spells.map((spell) => {
        const entry = SPELL_BY_ID.get(spell.catalogId)
        if (!entry) return null
        const damage = entry.attack?.baseDice ? ' · ' + entry.attack.baseDice + 'd' + entry.attack.dieSides + ' ' + entry.attack.damageType : ''
        return <article key={spell.id}><div className="managed-entry-main"><span className="entry-kind">{entry.category}</span><strong>{entry.name}</strong><p>{entry.summary}</p><small>{(entry.manaCost === null ? 'No Mana cost' : entry.manaCost + ' Mana') + ' · Rulebook p. ' + entry.page + damage}</small></div><label>Rank<input type="number" min="1" max="15" value={spell.rank} onChange={(event) => changeSpell(spell.id,{rank:Math.max(1,Math.min(15,Number(event.target.value)))})} /></label><label className="managed-check"><input type="checkbox" checked={spell.hotlisted} disabled={!spell.hotlisted && hotlistCount >= 10} onChange={(event) => changeSpell(spell.id,{hotlisted:event.target.checked})} /> Hotlist</label><label className="managed-notes">Notes<input value={spell.notes} onChange={(event) => changeSpell(spell.id,{notes:event.target.value})} /></label><a href={'/api/rulebook#page=' + (entry.page + 2)} target="_blank" rel="noreferrer">View rule ↗</a>{spell.catalogId !== 'heal' ? <button type="button" className="danger-button" onClick={() => setSheet((current) => ({...current,spells:current.spells.filter((item) => item.id !== spell.id)}))}>Remove</button> : null}</article>
      })}</div>
    </section>

    <section className="sheet-editor-section" hidden={tab !== 'inventory'}>
      <div className="manager-heading"><div><p className="eyebrow">Rulebook catalogue</p><h3>Manage Inventory</h3><p>Add weapons, consumables, explosives, and adventuring gear. Equip weapons to make them rollable from the character sheet.</p></div><span className="count-badge">{sheet.managedInventory.length} types</span></div>
      <div className="catalog-add"><label>Choose an item<select value={selectedItemId} onChange={(event) => setSelectedItemId(event.target.value)}>{ITEM_CATALOG.map((entry) => <option key={entry.id} value={entry.id}>{catalogOption(entry)}</option>)}</select></label><button type="button" className="primary-button" onClick={addInventoryItem}>Add item</button></div>
      <div className="managed-entry-list inventory">{sheet.managedInventory.map((item) => {
        const entry = ITEM_CATALOG.find((option) => option.id === item.catalogId)
        if (!entry) return null
        const combat = entry.attack ? ' · ' + entry.attack.range + ' · ' + (entry.attack.damageType ?? 'Effect') : ''
        return <article key={item.id}><div className="managed-entry-main"><span className="entry-kind">{entry.category}</span><strong>{entry.name}</strong><p>{entry.summary}</p><small>{'Rulebook p. ' + entry.page + combat}</small></div><label>Quantity<input type="number" min="0" max="9999" value={item.quantity} onChange={(event) => changeInventoryItem(item.id,{quantity:Math.max(0,Math.min(9999,Number(event.target.value)))})} /></label>{entry.attack ? <label>Skill Rank<input type="number" min="0" max="15" value={item.rank} onChange={(event) => changeInventoryItem(item.id,{rank:Math.max(0,Math.min(15,Number(event.target.value)))})} /></label> : null}{entry.attack ? <label className="managed-check"><input type="checkbox" checked={item.equipped} onChange={(event) => changeInventoryItem(item.id,{equipped:event.target.checked})} /> Equipped</label> : null}<label className="managed-check"><input type="checkbox" checked={item.hotlisted} disabled={!item.hotlisted && hotlistCount >= 10} onChange={(event) => changeInventoryItem(item.id,{hotlisted:event.target.checked})} /> Hotlist</label><label className="managed-notes">Notes<input value={item.notes} onChange={(event) => changeInventoryItem(item.id,{notes:event.target.value})} /></label><a href={'/api/rulebook#page=' + (entry.page + 2)} target="_blank" rel="noreferrer">View rule ↗</a><button type="button" className="danger-button" onClick={() => setSheet((current) => ({...current,managedInventory:current.managedInventory.filter((entry) => entry.id !== item.id)}))}>Remove</button></article>
      })}</div>
      <h3>Custom inventory entries</h3><RowEditor rows={sheet.inventory} columns={[{key:'item',label:'Item',wide:true},{key:'quantity',label:'Quantity',type:'number'},{key:'notes',label:'Notes',wide:true}]} onChange={(...args) => changeRow('inventory',...args)} onAdd={() => addRow('inventory',{item:'',quantity:1,notes:''})} onRemove={(index) => removeRow('inventory',index)} />
    </section>
    <div className="modal-actions sticky"><button type="button" className="ghost-button" onClick={onCancel}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save complete sheet'}</button></div>
  </form>
}
