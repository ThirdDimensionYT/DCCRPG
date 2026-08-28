import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  adjustCharacterHealth,
  createCampaign,
  createCharacter,
  deleteCampaign,
  deleteCharacter,
  levelUpCharacter,
  loadBootstrap,
  loadAuthStatus,
  logout,
  parseCharacterSheetData,
  updateCharacter,
  uploadCharacterArt,
  type AuthStatus,
  type BootstrapData,
  type Campaign,
  type Character,
  type CharacterUpdate,
} from './api'
import AuthScreen from './AuthScreen'
import AccountSettings from './AccountSettings'
import CharacterSheetEditor from './CharacterSheetEditor'
import CharacterCreator, { type CharacterDraft } from './CharacterCreator'
import Compendium from './Compendium'
import DiceRoller from './DiceRoller'
import LevelUpDialog from './LevelUpDialog'
import PlayerManagement from './PlayerManagement'
import Rulebook from './Rulebook'
import { CLASSES, RACES, statRuleSummary, type StatBlock } from '../shared/rules'
import './App.css'

type View = 'dashboard' | 'characters' | 'campaigns' | 'compendium' | 'rulebook' | 'players' | 'account'

const navItems: Array<{ id: View; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: '⌂' },
  { id: 'characters', label: 'Characters', icon: '♟' },
  { id: 'campaigns', label: 'Campaigns', icon: '◇' },
  { id: 'compendium', label: 'Compendium', icon: '▤' },
  { id: 'rulebook', label: 'Rulebook', icon: '▣' },
  { id: 'players', label: 'Player access', icon: '⚿' },
  { id: 'account', label: 'My account', icon: '⚙' },
]

const statLabels = [
  ['strength', 'STR'],
  ['intelligence', 'INT'],
  ['constitution', 'CON'],
  ['dexterity', 'DEX'],
  ['charisma', 'CHA'],
] as const

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

function displayMod(value: number) {
  return `+${statModifier(value)}`
}

function Logo() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <span>D</span>
    </div>
  )
}

function App() {
  const [view, setView] = useState<View>('dashboard')
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null)
  const [data, setData] = useState<BootstrapData | null>(null)
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const characterDialog = useRef<HTMLDialogElement>(null)
  const editCharacterDialog = useRef<HTMLDialogElement>(null)
  const levelUpDialog = useRef<HTMLDialogElement>(null)
  const campaignDialog = useRef<HTMLDialogElement>(null)

  async function refresh(preferredCharacterId?: string) {
    const next = await loadBootstrap()
    setData(next)
    setSelectedCharacterId((current) => preferredCharacterId ?? (current && next.characters.some((character) => character.id === current) ? current : next.characters[0]?.id ?? null))
  }

  async function initialize() {
    const auth = await loadAuthStatus()
    setAuthStatus(auth)
    if (!auth.authenticated) {
      setData(null)
      return
    }
    const next = await loadBootstrap()
    setData(next)
    setSelectedCharacterId(next.characters[0]?.id ?? null)
  }

  useEffect(() => {
    void initialize()
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load the crawler interface.'))
      .finally(() => setLoading(false))
  }, [])

  async function signOut() {
    try {
      await logout()
    } finally {
      setData(null)
      setView('dashboard')
      setAuthStatus(await loadAuthStatus())
    }
  }

  const selectedCharacter = useMemo(
    () => data?.characters.find((character) => character.id === selectedCharacterId) ?? null,
    [data, selectedCharacterId],
  )

  async function submitCharacter(draft: CharacterDraft) {
    setSaving(true)
    setError(null)
    try {
      const result = await createCharacter(draft)
      await refresh(result.id)
      characterDialog.current?.close()
      setView('characters')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not create the character.')
      throw reason
    } finally {
      setSaving(false)
    }
  }

  async function submitCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSaving(true)
    setError(null)
    try {
      await createCampaign({
        name: String(form.get('name') ?? ''),
        description: String(form.get('description') ?? ''),
        floor: Number(form.get('floor') ?? 3),
      })
      await refresh()
      campaignDialog.current?.close()
      setView('campaigns')
      event.currentTarget.reset()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not create the campaign.')
    } finally {
      setSaving(false)
    }
  }

  async function removeCampaign(campaign: Campaign) {
    if (!window.confirm(`Permanently delete “${campaign.name}”? Its characters will be kept, but they will no longer belong to a campaign.`)) return
    setSaving(true)
    setError(null)
    try {
      await deleteCampaign(campaign.id)
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not delete the campaign.')
    } finally {
      setSaving(false)
    }
  }

  async function submitCharacterEdit(update: CharacterUpdate, art: File | null) {
    if (!selectedCharacter) return
    setSaving(true)
    setError(null)
    try {
      await updateCharacter(selectedCharacter.id, update)
      if (art) await uploadCharacterArt(selectedCharacter.id, art)
      await refresh(selectedCharacter.id)
      editCharacterDialog.current?.close()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update the character sheet.')
    } finally {
      setSaving(false)
    }
  }

  async function removeCharacter() {
    if (!selectedCharacter) return
    if (!window.confirm(`Permanently delete ${selectedCharacter.name}? This cannot be undone.`)) return
    setSaving(true)
    setError(null)
    try {
      await deleteCharacter(selectedCharacter.id)
      editCharacterDialog.current?.close()
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not delete the character.')
    } finally {
      setSaving(false)
    }
  }

  async function changeHealth(delta: -1 | 1) {
    if (!selectedCharacter || saving) return
    setSaving(true)
    setError(null)
    try {
      await adjustCharacterHealth(selectedCharacter.id, delta)
      await refresh(selectedCharacter.id)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update Health.')
    } finally {
      setSaving(false)
    }
  }

  async function applyLevels(levels: number, statPoints: StatBlock) {
    if (!selectedCharacter) return
    setSaving(true)
    setError(null)
    try {
      await levelUpCharacter(selectedCharacter.id, { levels, statPoints })
      await refresh(selectedCharacter.id)
      levelUpDialog.current?.close()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not apply the Level increase.')
      throw reason
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="launch-screen"><Logo /><p>Initializing crawler interface…</p></div>
  }

  if (!authStatus?.authenticated) {
    return <AuthScreen setupRequired={authStatus?.setupRequired ?? false} onAuthenticated={initialize} />
  }

  const visibleNavItems = navItems.filter((item) => item.id !== 'players' || data?.user.role === 'admin')

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setView('dashboard')}>
          <Logo />
          <span><strong>DCC</strong><small>Crawler Portal</small></span>
        </button>

        <nav aria-label="Primary navigation">
          {visibleNavItems.map((item) => (
            <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)}>
              <span className="nav-icon">{item.icon}</span>{item.label}
              {item.id === 'characters' && data?.characters.length ? <em>{data.characters.length}</em> : null}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-status"><i /> System online</div>
          <div className="user-chip">
            <span>{data?.user.displayName.slice(0, 2).toUpperCase() ?? 'CR'}</span>
            <div><strong>{data?.user.displayName ?? 'Crawler'}</strong><small>Authenticated crawler</small></div>
          </div>
          <button className="sign-out-button" onClick={() => void signOut()}>Sign out</button>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">Crawler Interface // Earth season</p>
            <h1>{view === 'dashboard' ? 'Welcome to the Dungeon' : visibleNavItems.find((item) => item.id === view)?.label}</h1>
          </div>
          <div className="header-actions">
            {data?.user.role === 'admin' ? <button className="ghost-button" onClick={() => campaignDialog.current?.showModal()}>New campaign</button> : null}
            <button className="primary-button" onClick={() => characterDialog.current?.showModal()}>+ Create crawler</button>
          </div>
        </header>

        {error ? <div className="error-banner"><strong>Interface alert</strong><span>{error}</span><button onClick={() => setError(null)}>×</button></div> : null}

        {view === 'dashboard' && <Dashboard data={data} onOpenCharacter={(id) => { setSelectedCharacterId(id); setView('characters') }} onCreate={() => characterDialog.current?.showModal()} />}
        {view === 'characters' && <Characters characters={data?.characters ?? []} selected={selectedCharacter} isAdmin={data?.user.role === 'admin'} saving={saving} onSelect={setSelectedCharacterId} onCreate={() => characterDialog.current?.showModal()} onEdit={() => editCharacterDialog.current?.showModal()} onLevelUp={() => levelUpDialog.current?.showModal()} onDelete={() => void removeCharacter()} onHealthChange={(delta) => void changeHealth(delta)} />}
        {view === 'campaigns' && <Campaigns campaigns={data?.campaigns ?? []} canCreate={data?.user.role === 'admin'} saving={saving} onCreate={() => campaignDialog.current?.showModal()} onDelete={(campaign) => void removeCampaign(campaign)} />}
        {view === 'compendium' && <Compendium />}
        {view === 'rulebook' && <Rulebook />}
        {view === 'players' && data?.user.role === 'admin' ? <PlayerManagement currentUserId={data.user.id} onSignedOut={signOut} /> : null}
        {view === 'account' && data ? <AccountSettings user={data.user} /> : null}
      </main>

      <dialog ref={characterDialog} className="modal builder-modal">
        <CharacterCreator campaigns={data?.campaigns ?? []} saving={saving} onCancel={() => characterDialog.current?.close()} onCreate={submitCharacter} />
      </dialog>

      {selectedCharacter ? <dialog ref={editCharacterDialog} className="modal character-editor">
        <CharacterSheetEditor character={selectedCharacter} saving={saving} isAdmin={data?.user.role === 'admin'} onCancel={() => editCharacterDialog.current?.close()} onSave={submitCharacterEdit} />
      </dialog> : null}

      {selectedCharacter ? <dialog ref={levelUpDialog} className="modal level-up-modal">
        <LevelUpDialog key={`${selectedCharacter.id}-${selectedCharacter.level}`} character={selectedCharacter} saving={saving} onCancel={() => levelUpDialog.current?.close()} onConfirm={applyLevels} />
      </dialog> : null}

      <dialog ref={campaignDialog} className="modal">
        <form onSubmit={submitCampaign}>
          <div className="modal-heading"><div><p className="eyebrow">Game Master tools</p><h2>Create a campaign</h2></div><button type="button" onClick={() => campaignDialog.current?.close()}>×</button></div>
          <label>Campaign name<input name="name" required maxLength={80} placeholder="The Third Floor" /></label>
          <label>Description<textarea name="description" maxLength={500} rows={4} placeholder="A short briefing for your crawlers" /></label>
          <label>Current floor<select name="floor" defaultValue="3">{Array.from({ length: 18 }, (_, index) => <option key={index + 1} value={index + 1}>Floor {index + 1}</option>)}</select></label>
          <div className="modal-actions"><button type="button" className="ghost-button" onClick={() => campaignDialog.current?.close()}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Creating…' : 'Create campaign'}</button></div>
        </form>
      </dialog>
      <DiceRoller />
    </div>
  )
}

function Dashboard({ data, onOpenCharacter, onCreate }: { data: BootstrapData | null; onOpenCharacter: (id: string) => void; onCreate: () => void }) {
  const characters = data?.characters ?? []
  const campaigns = data?.campaigns ?? []
  return (
    <div className="content dashboard-grid">
      <section className="hero-panel">
        <div className="hero-copy"><span className="floor-badge">Floor 3 access granted</span><h2>Survive. Advance.<br /><em>Entertain.</em></h2><p>Your digital crawler interface tracks every stat, skill, bad decision, and increasingly questionable piece of loot.</p><button className="primary-button" onClick={onCreate}>Create your first crawler</button></div>
        <div className="dungeon-orbit" aria-hidden="true"><div className="orbit one" /><div className="orbit two" /><div className="core"><span>AI</span><small>watching</small></div></div>
      </section>

      <section className="metric-card"><span className="metric-icon crimson">♟</span><div><strong>{characters.length}</strong><small>Active crawlers</small></div></section>
      <section className="metric-card"><span className="metric-icon gold">◇</span><div><strong>{campaigns.length}</strong><small>Campaigns</small></div></section>
      <section className="metric-card"><span className="metric-icon blue">▤</span><div><strong>650</strong><small>Source pages mapped</small></div></section>

      <section className="panel recent-panel">
        <div className="panel-heading"><div><p className="eyebrow">Your roster</p><h3>Recent crawlers</h3></div><button className="text-button" onClick={onCreate}>Add crawler →</button></div>
        {characters.length ? <div className="crawler-list">{characters.slice(0, 4).map((character) => <CharacterRow key={character.id} character={character} onClick={() => onOpenCharacter(character.id)} />)}</div> : <EmptyState title="No crawlers have entered yet" body="Create a Level 10 crawler and begin building their sheet." action="Create crawler" onAction={onCreate} />}
      </section>

      <section className="panel activity-panel">
        <div className="panel-heading"><div><p className="eyebrow">Interface feed</p><h3>System notifications</h3></div></div>
        <div className="activity-item"><span>!</span><div><strong>New achievement!</strong><p>The application foundation survived initial setup.</p><small>Just now</small></div></div>
        <div className="activity-item"><span>3</span><div><strong>Third Floor ready</strong><p>Level 10 character records and campaign storage are online.</p><small>System event</small></div></div>
        <div className="activity-item muted"><span>→</span><div><strong>Next unlock</strong><p>Guided backgrounds, stat allocation, tutorial experiences, and starting loot.</p><small>Planned</small></div></div>
      </section>
    </div>
  )
}

function CharacterRow({ character, onClick }: { character: Character; onClick: () => void }) {
  return <button className="crawler-row" onClick={onClick}><span className="avatar">{character.name.slice(0, 2).toUpperCase()}</span><span className="crawler-summary"><strong>{character.name}</strong><small>{character.race} · {character.class_name}</small></span><span className="level-pill">LVL {character.level}</span><span className="floor-copy">Floor {character.floor}<small>{character.campaign_name ?? 'Unaffiliated'}</small></span><span className="row-arrow">›</span></button>
}

function Characters({ characters, selected, isAdmin, saving, onSelect, onCreate, onEdit, onLevelUp, onDelete, onHealthChange }: { characters: Character[]; selected: Character | null; isAdmin: boolean; saving: boolean; onSelect: (id: string) => void; onCreate: () => void; onEdit: () => void; onLevelUp: () => void; onDelete: () => void; onHealthChange: (delta: -1 | 1) => void }) {
  if (!characters.length) return <div className="content"><section className="panel"><EmptyState title="Your roster is empty" body="Build your first Level 10 crawler to open the digital character sheet." action="Create crawler" onAction={onCreate} /></section></div>
  return <div className="content character-layout"><aside className="character-rail"><div className="rail-title"><p className="eyebrow">Roster</p><button onClick={onCreate}>+</button></div>{characters.map((character) => <button key={character.id} className={`${selected?.id === character.id ? 'selected' : ''} ${character.health_slots_lost === 10 ? 'dying' : ''}`} onClick={() => onSelect(character.id)}><span>{character.name.slice(0, 2).toUpperCase()}</span><div><strong>{character.name}</strong><small>{character.health_slots_lost === 10 ? 'DYING · ' : ''}{isAdmin ? `${character.owner_display_name} · ` : ''}Level {character.level} · Floor {character.floor}</small></div></button>)}</aside>{selected ? <CharacterSheet character={selected} isAdmin={isAdmin} saving={saving} onEdit={onEdit} onLevelUp={onLevelUp} onDelete={onDelete} onHealthChange={onHealthChange} /> : null}</div>
}

function CharacterSheet({ character, isAdmin, saving, onEdit, onLevelUp, onDelete, onHealthChange }: { character: Character; isAdmin: boolean; saving: boolean; onEdit: () => void; onLevelUp: () => void; onDelete: () => void; onHealthChange: (delta: -1 | 1) => void }) {
  const healthValue = statModifier(character.constitution)
  const dying = character.health_slots_lost === 10
  const sheetData = parseCharacterSheetData(character.sheet_data)
  const race = RACES.find((option) => option.name === character.race)
  const characterClass = CLASSES.find((option) => option.name === character.class_name)
  return <section className="sheet">
    <div className={`sheet-header ${dying ? 'dying' : ''}`}>{character.art_key ? <img className="sheet-art" src={`/api/characters/${encodeURIComponent(character.id)}/art?v=${encodeURIComponent(character.art_key)}`} alt={`${character.name} character art`} /> : <div className="sheet-avatar">{character.name.slice(0, 2).toUpperCase()}<span>#{character.crawler_number.toLocaleString()}</span></div>}<div><p className="eyebrow">Crawler profile</p><h2>{character.name}</h2><p>{character.race} · {character.class_name} · Level {character.level}</p>{dying ? <strong className="dying-status">DYING</strong> : null}{isAdmin ? <p className="owner-label">Player: {character.owner_display_name} (@{character.owner_username})</p> : null}</div><div className="sheet-tags"><span>Floor {character.floor}</span><span>{character.size_name} ({character.size_value})</span><button className="level-up-button" onClick={onLevelUp} disabled={character.level >= 250}>{character.level >= 250 ? 'Max Level' : '↑ Level Up'}</button><button className="ghost-button" onClick={onEdit}>Edit sheet</button><button className="danger-button" onClick={onDelete}>Delete</button></div></div>
    <div className="stat-grid">{statLabels.map(([key, label]) => { const value = character[key]; return <article key={key}><small>{label}</small><strong>{value}</strong><span>{displayMod(value)}</span><em>Enhanced</em></article> })}</div>
    <div className="vitals-grid"><article className={`interactive-health ${dying ? 'dying' : ''}`}><div><small>{dying ? 'Current state' : 'Health bar'}</small><strong>{dying ? 'DYING' : `${10 - character.health_slots_lost}/10 slots`}</strong></div><div className="health-track">{Array.from({ length: 10 }, (_, index) => <i key={index} className={index >= 10 - character.health_slots_lost ? 'lost' : ''}><span>{healthValue}</span></i>)}</div><div className="health-actions"><button type="button" className="damage-button" disabled={saving || dying} onClick={() => onHealthChange(1)}>− Take damage</button><button type="button" className="heal-button" disabled={saving || character.health_slots_lost === 0} onClick={() => onHealthChange(-1)}>+ Heal</button></div></article><article><small>Mana</small><strong>{character.current_mana}</strong><span>Max {character.intelligence}</span></article><article><small>Evade</small><strong>d20 {displayMod(character.dexterity)}</strong><span>DEX modifier</span></article><article><small>AI Favor</small><strong>{character.ai_favor}</strong><span>Spend wisely</span></article></div>
    <section className="progression-summary"><div className="panel-heading"><div><p className="eyebrow">Always available</p><h3>Race, Class & Level benefits</h3></div><span className="count-badge">Level {character.level}</span></div><div className="progression-cards"><article><small>Race package</small><strong>{character.race}</strong><b>{statRuleSummary(character.race)}</b><p>{race?.summary}</p>{character.race === 'Primal' ? <em>Level effect: +1 AI Favor whenever you level up.</em> : null}{character.race === 'Bune' ? <em>{character.level >= 50 ? 'Level 50 milestone active.' : `Level 50 milestone: +2 DEX and strengthened wings.`}</em> : null}</article><article><small>Class package</small><strong>{character.class_name}</strong><b>{statRuleSummary(character.class_name)}</b><p>{characterClass?.summary}</p><em>Class benefits activate at selection; this class has no separate Level unlock track.</em></article>{sheetData.unlockedFeatures.map((feature) => <article className="unlocked" key={feature.id}><small>{feature.source} · Level {feature.level}</small><strong>{feature.name}</strong><p>{feature.summary}</p><a href={`/api/rulebook#page=${feature.page+2}`} target="_blank" rel="noreferrer">Rulebook p. {feature.page}</a></article>)}</div>{sheetData.advancementLog.length ? <details className="advancement-history"><summary>Advancement history ({sheetData.advancementLog.length})</summary>{sheetData.advancementLog.map((entry,index) => <div key={`${entry.createdAt}-${index}`}><strong>Level {entry.fromLevel} → {entry.toLevel}</strong><span>{Object.entries(entry.statPoints).filter(([,value]) => value).map(([key,value]) => `+${value} ${key.slice(0,3).toUpperCase()}`).join(' · ') || 'No Stat points'}</span>{entry.automaticEffects.map((effect) => <small key={effect}>{effect}</small>)}</div>)}</details> : null}</section>
    <div className="sheet-columns"><section className="panel inset"><div className="panel-heading"><div><p className="eyebrow">Checks & attacks</p><h3>Skills</h3></div><span className="count-badge">{character.skills.length}</span></div>{character.skills.length ? <div className="skill-list">{character.skills.map((skill) => <div key={skill.id}><span><strong>{skill.name}</strong><small>{skill.check_type} · {skill.stat ?? 'Passive'}</small></span><b>Rank {skill.rank}</b><em>{skill.advancement_marked ? '✓' : '○'}</em></div>)}</div> : <p className="empty-copy">No skills recorded yet.</p>}</section><section className="panel inset"><div className="panel-heading"><div><p className="eyebrow">Quick access</p><h3>Hotlist</h3></div><span className="count-badge">0/10</span></div><div className="hotlist-grid">{Array.from({ length: 10 }, (_, index) => <button key={index}><small>{index + 1}</small>{index === 0 ? <><strong>Heal</strong><span>2 Mana</span></> : <em>Empty</em>}</button>)}</div></section></div>
  </section>
}

function Campaigns({ campaigns, canCreate, saving, onCreate, onDelete }: { campaigns: Campaign[]; canCreate: boolean; saving: boolean; onCreate: () => void; onDelete: (campaign: Campaign) => void }) {
  return <div className="content"><section className="section-intro"><div><p className="eyebrow">Shared adventures</p><h2>Campaign control</h2><p>{canCreate ? "Manage floors, parties, and the stories your crawlers probably won't survive." : 'View the campaigns to which your crawler has been assigned.'}</p></div>{canCreate ? <button className="primary-button" onClick={onCreate}>+ New campaign</button> : null}</section>{campaigns.length ? <div className="campaign-grid">{campaigns.map((campaign) => <article className="campaign-card" key={campaign.id}><div className="campaign-art"><span>F{campaign.floor}</span><div /></div><div className="campaign-body"><div className="campaign-status-row"><span className="status-pill">{campaign.status}</span>{canCreate ? <button className="danger-button" disabled={saving} onClick={() => onDelete(campaign)}>Delete campaign</button> : null}</div><h3>{campaign.name}</h3><p>{campaign.description || 'No briefing has been added.'}</p><footer><span><strong>{campaign.member_count}</strong> members</span><span><strong>{campaign.character_count}</strong> crawlers</span></footer></div></article>)}</div> : canCreate ? <section className="panel"><EmptyState title="No active campaigns" body="Create a campaign, choose its current floor, and invite your party later." action="Create campaign" onAction={onCreate} /></section> : <section className="panel player-empty"><h3>No assigned campaigns</h3><p>The owner has not assigned you to a campaign yet.</p></section>}</div>
}

function EmptyState({ title, body, action, onAction }: { title: string; body: string; action: string; onAction: () => void }) {
  return <div className="empty-state"><div>+</div><h3>{title}</h3><p>{body}</p><button className="primary-button" onClick={onAction}>{action}</button></div>
}

export default App
