import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  createCampaign,
  createCharacter,
  deleteCharacter,
  loadBootstrap,
  loadAuthStatus,
  logout,
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
import DiceRoller from './DiceRoller'
import PlayerManagement from './PlayerManagement'
import './App.css'

type View = 'dashboard' | 'characters' | 'campaigns' | 'compendium' | 'dice' | 'players' | 'account'

const navItems: Array<{ id: View; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: '⌂' },
  { id: 'characters', label: 'Characters', icon: '♟' },
  { id: 'campaigns', label: 'Campaigns', icon: '◇' },
  { id: 'compendium', label: 'Compendium', icon: '▤' },
  { id: 'dice', label: 'Dice roller', icon: '⚄' },
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
        {view === 'characters' && <Characters characters={data?.characters ?? []} selected={selectedCharacter} isAdmin={data?.user.role === 'admin'} onSelect={setSelectedCharacterId} onCreate={() => characterDialog.current?.showModal()} onEdit={() => editCharacterDialog.current?.showModal()} onDelete={() => void removeCharacter()} />}
        {view === 'campaigns' && <Campaigns campaigns={data?.campaigns ?? []} canCreate={data?.user.role === 'admin'} onCreate={() => campaignDialog.current?.showModal()} />}
        {view === 'compendium' && <Compendium />}
        {view === 'dice' && <DiceRoller />}
        {view === 'players' && data?.user.role === 'admin' ? <PlayerManagement currentUserId={data.user.id} onSignedOut={signOut} /> : null}
        {view === 'account' && data ? <AccountSettings user={data.user} /> : null}
      </main>

      <dialog ref={characterDialog} className="modal builder-modal">
        <CharacterCreator campaigns={data?.campaigns ?? []} saving={saving} onCancel={() => characterDialog.current?.close()} onCreate={submitCharacter} />
      </dialog>

      {selectedCharacter ? <dialog ref={editCharacterDialog} className="modal character-editor">
        <CharacterSheetEditor character={selectedCharacter} saving={saving} isAdmin={data?.user.role === 'admin'} onCancel={() => editCharacterDialog.current?.close()} onSave={submitCharacterEdit} />
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

function Characters({ characters, selected, isAdmin, onSelect, onCreate, onEdit, onDelete }: { characters: Character[]; selected: Character | null; isAdmin: boolean; onSelect: (id: string) => void; onCreate: () => void; onEdit: () => void; onDelete: () => void }) {
  if (!characters.length) return <div className="content"><section className="panel"><EmptyState title="Your roster is empty" body="Build your first Level 10 crawler to open the digital character sheet." action="Create crawler" onAction={onCreate} /></section></div>
  return <div className="content character-layout"><aside className="character-rail"><div className="rail-title"><p className="eyebrow">Roster</p><button onClick={onCreate}>+</button></div>{characters.map((character) => <button key={character.id} className={selected?.id === character.id ? 'selected' : ''} onClick={() => onSelect(character.id)}><span>{character.name.slice(0, 2).toUpperCase()}</span><div><strong>{character.name}</strong><small>{isAdmin ? `${character.owner_display_name} · ` : ''}Level {character.level} · Floor {character.floor}</small></div></button>)}</aside>{selected ? <CharacterSheet character={selected} isAdmin={isAdmin} onEdit={onEdit} onDelete={onDelete} /> : null}</div>
}

function CharacterSheet({ character, isAdmin, onEdit, onDelete }: { character: Character; isAdmin: boolean; onEdit: () => void; onDelete: () => void }) {
  const healthValue = statModifier(character.constitution)
  return <section className="sheet">
    <div className="sheet-header">{character.art_key ? <img className="sheet-art" src={`/api/characters/${encodeURIComponent(character.id)}/art?v=${encodeURIComponent(character.art_key)}`} alt={`${character.name} character art`} /> : <div className="sheet-avatar">{character.name.slice(0, 2).toUpperCase()}<span>#{character.crawler_number.toLocaleString()}</span></div>}<div><p className="eyebrow">Crawler profile</p><h2>{character.name}</h2><p>{character.race} · {character.class_name} · Level {character.level}</p>{isAdmin ? <p className="owner-label">Player: {character.owner_display_name} (@{character.owner_username})</p> : null}</div><div className="sheet-tags"><span>Floor {character.floor}</span><span>{character.size_name} ({character.size_value})</span><button className="ghost-button" onClick={onEdit}>Edit sheet</button><button className="danger-button" onClick={onDelete}>Delete</button></div></div>
    <div className="stat-grid">{statLabels.map(([key, label]) => { const value = character[key]; return <article key={key}><small>{label}</small><strong>{value}</strong><span>{displayMod(value)}</span><em>Enhanced</em></article> })}</div>
    <div className="vitals-grid"><article><div><small>Health bar</small><strong>{10 - character.health_slots_lost}/10 slots</strong></div><div className="health-track">{Array.from({ length: 10 }, (_, index) => <i key={index} className={index >= 10 - character.health_slots_lost ? 'lost' : ''}><span>{healthValue}</span></i>)}</div></article><article><small>Mana</small><strong>{character.current_mana}</strong><span>Max {character.intelligence}</span></article><article><small>Evade</small><strong>d20 {displayMod(character.dexterity)}</strong><span>DEX modifier</span></article><article><small>AI Favor</small><strong>{character.ai_favor}</strong><span>Spend wisely</span></article></div>
    <div className="sheet-columns"><section className="panel inset"><div className="panel-heading"><div><p className="eyebrow">Checks & attacks</p><h3>Skills</h3></div><span className="count-badge">{character.skills.length}</span></div>{character.skills.length ? <div className="skill-list">{character.skills.map((skill) => <div key={skill.id}><span><strong>{skill.name}</strong><small>{skill.check_type} · {skill.stat ?? 'Passive'}</small></span><b>Rank {skill.rank}</b><em>{skill.advancement_marked ? '✓' : '○'}</em></div>)}</div> : <p className="empty-copy">No skills recorded yet.</p>}</section><section className="panel inset"><div className="panel-heading"><div><p className="eyebrow">Quick access</p><h3>Hotlist</h3></div><span className="count-badge">0/10</span></div><div className="hotlist-grid">{Array.from({ length: 10 }, (_, index) => <button key={index}><small>{index + 1}</small>{index === 0 ? <><strong>Heal</strong><span>2 Mana</span></> : <em>Empty</em>}</button>)}</div></section></div>
  </section>
}

function Campaigns({ campaigns, canCreate, onCreate }: { campaigns: Campaign[]; canCreate: boolean; onCreate: () => void }) {
  return <div className="content"><section className="section-intro"><div><p className="eyebrow">Shared adventures</p><h2>Campaign control</h2><p>{canCreate ? "Manage floors, parties, and the stories your crawlers probably won't survive." : 'View the campaigns to which your crawler has been assigned.'}</p></div>{canCreate ? <button className="primary-button" onClick={onCreate}>+ New campaign</button> : null}</section>{campaigns.length ? <div className="campaign-grid">{campaigns.map((campaign) => <article className="campaign-card" key={campaign.id}><div className="campaign-art"><span>F{campaign.floor}</span><div /></div><div className="campaign-body"><span className="status-pill">{campaign.status}</span><h3>{campaign.name}</h3><p>{campaign.description || 'No briefing has been added.'}</p><footer><span><strong>{campaign.member_count}</strong> members</span><span><strong>{campaign.character_count}</strong> crawlers</span></footer></div></article>)}</div> : canCreate ? <section className="panel"><EmptyState title="No active campaigns" body="Create a campaign, choose its current floor, and invite your party later." action="Create campaign" onAction={onCreate} /></section> : <section className="panel player-empty"><h3>No assigned campaigns</h3><p>The owner has not assigned you to a campaign yet.</p></section>}</div>
}

function Compendium() {
  const categories = [['Skills', 'Attack and utility skills mapped for character creation', '114 mapped'], ['Spells', 'Mana costs, ranks, and effects', 'Coming next'], ['Races & Classes', 'Concise summaries, groups, prerequisites, and page references', '82 mapped'], ['Gear & Loot', 'Weapons, armor, consumables, and boxes', 'Coming next']]
  return <div className="content"><section className="section-intro"><div><p className="eyebrow">Structured rules</p><h2>Compendium foundation</h2><p>This area will contain concise, licensed rules data with references back to the sourcebook—not a reproduction of the book.</p></div></section><div className="compendium-grid">{categories.map(([title, body, count], index) => <article key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{body}</p></div><em>{count}</em></article>)}</div></div>
}

function EmptyState({ title, body, action, onAction }: { title: string; body: string; action: string; onAction: () => void }) {
  return <div className="empty-state"><div>+</div><h3>{title}</h3><p>{body}</p><button className="primary-button" onClick={onAction}>{action}</button></div>
}

export default App
