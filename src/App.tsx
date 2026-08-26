import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  createCampaign,
  createCharacter,
  loadBootstrap,
  type BootstrapData,
  type Campaign,
  type Character,
} from './api'
import './App.css'

type View = 'dashboard' | 'characters' | 'campaigns' | 'compendium'

const navItems: Array<{ id: View; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: '⌂' },
  { id: 'characters', label: 'Characters', icon: '♟' },
  { id: 'campaigns', label: 'Campaigns', icon: '◇' },
  { id: 'compendium', label: 'Compendium', icon: '▤' },
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
  const [data, setData] = useState<BootstrapData | null>(null)
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const characterDialog = useRef<HTMLDialogElement>(null)
  const campaignDialog = useRef<HTMLDialogElement>(null)

  async function refresh(preferredCharacterId?: string) {
    const next = await loadBootstrap()
    setData(next)
    setSelectedCharacterId((current) => preferredCharacterId ?? current ?? next.characters[0]?.id ?? null)
  }

  useEffect(() => {
    void loadBootstrap()
      .then((next) => {
        setData(next)
        setSelectedCharacterId(next.characters[0]?.id ?? null)
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load the crawler interface.'))
      .finally(() => setLoading(false))
  }, [])

  const selectedCharacter = useMemo(
    () => data?.characters.find((character) => character.id === selectedCharacterId) ?? null,
    [data, selectedCharacterId],
  )

  async function submitCharacter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSaving(true)
    setError(null)
    try {
      const result = await createCharacter({
        name: String(form.get('name') ?? ''),
        crawlerNumber: Number(form.get('crawlerNumber') ?? 500000),
        race: String(form.get('race') ?? 'Human'),
        className: String(form.get('className') ?? 'Unselected'),
        campaignId: String(form.get('campaignId') ?? '') || null,
      })
      await refresh(result.id)
      characterDialog.current?.close()
      setView('characters')
      event.currentTarget.reset()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not create the character.')
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

  if (loading) {
    return <div className="launch-screen"><Logo /><p>Initializing crawler interface…</p></div>
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setView('dashboard')}>
          <Logo />
          <span><strong>DCC</strong><small>Crawler Portal</small></span>
        </button>

        <nav aria-label="Primary navigation">
          {navItems.map((item) => (
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
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">Crawler Interface // Earth season</p>
            <h1>{view === 'dashboard' ? 'Welcome to the Dungeon' : navItems.find((item) => item.id === view)?.label}</h1>
          </div>
          <div className="header-actions">
            <button className="ghost-button" onClick={() => campaignDialog.current?.showModal()}>New campaign</button>
            <button className="primary-button" onClick={() => characterDialog.current?.showModal()}>+ Create crawler</button>
          </div>
        </header>

        {error ? <div className="error-banner"><strong>Interface alert</strong><span>{error}</span><button onClick={() => setError(null)}>×</button></div> : null}

        {view === 'dashboard' && <Dashboard data={data} onOpenCharacter={(id) => { setSelectedCharacterId(id); setView('characters') }} onCreate={() => characterDialog.current?.showModal()} />}
        {view === 'characters' && <Characters characters={data?.characters ?? []} selected={selectedCharacter} onSelect={setSelectedCharacterId} onCreate={() => characterDialog.current?.showModal()} />}
        {view === 'campaigns' && <Campaigns campaigns={data?.campaigns ?? []} onCreate={() => campaignDialog.current?.showModal()} />}
        {view === 'compendium' && <Compendium />}
      </main>

      <dialog ref={characterDialog} className="modal">
        <form onSubmit={submitCharacter}>
          <div className="modal-heading"><div><p className="eyebrow">New crawler</p><h2>Enter the dungeon</h2></div><button type="button" onClick={() => characterDialog.current?.close()}>×</button></div>
          <label>Crawler name<input name="name" required maxLength={80} placeholder="Your crawler's name" /></label>
          <div className="form-grid">
            <label>Crawler number<input name="crawlerNumber" type="number" min="1" max="12900000" defaultValue="500000" /></label>
            <label>Starting floor<select name="floor" defaultValue="3" disabled><option value="3">Third floor · Level 10</option></select></label>
            <label>Race<input name="race" defaultValue="Human" maxLength={80} /></label>
            <label>Class<input name="className" defaultValue="Unselected" maxLength={80} /></label>
          </div>
          <label>Campaign<select name="campaignId" defaultValue=""><option value="">No campaign yet</option>{data?.campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></label>
          <p className="form-note">The guided background, Race, Class, and Tutorial Floor experience flow is the next implementation milestone.</p>
          <div className="modal-actions"><button type="button" className="ghost-button" onClick={() => characterDialog.current?.close()}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Creating…' : 'Create crawler'}</button></div>
        </form>
      </dialog>

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
        <div className="activity-item muted"><span>→</span><div><strong>Next unlock</strong><p>Guided backgrounds, Race/Class prerequisites, and rules data.</p><small>Planned</small></div></div>
      </section>
    </div>
  )
}

function CharacterRow({ character, onClick }: { character: Character; onClick: () => void }) {
  return <button className="crawler-row" onClick={onClick}><span className="avatar">{character.name.slice(0, 2).toUpperCase()}</span><span className="crawler-summary"><strong>{character.name}</strong><small>{character.race} · {character.class_name}</small></span><span className="level-pill">LVL {character.level}</span><span className="floor-copy">Floor {character.floor}<small>{character.campaign_name ?? 'Unaffiliated'}</small></span><span className="row-arrow">›</span></button>
}

function Characters({ characters, selected, onSelect, onCreate }: { characters: Character[]; selected: Character | null; onSelect: (id: string) => void; onCreate: () => void }) {
  if (!characters.length) return <div className="content"><section className="panel"><EmptyState title="Your roster is empty" body="Build your first Level 10 crawler to open the digital character sheet." action="Create crawler" onAction={onCreate} /></section></div>
  return <div className="content character-layout"><aside className="character-rail"><div className="rail-title"><p className="eyebrow">Roster</p><button onClick={onCreate}>+</button></div>{characters.map((character) => <button key={character.id} className={selected?.id === character.id ? 'selected' : ''} onClick={() => onSelect(character.id)}><span>{character.name.slice(0, 2).toUpperCase()}</span><div><strong>{character.name}</strong><small>Level {character.level} · Floor {character.floor}</small></div></button>)}</aside>{selected ? <CharacterSheet character={selected} /> : null}</div>
}

function CharacterSheet({ character }: { character: Character }) {
  const healthValue = statModifier(character.constitution)
  return <section className="sheet">
    <div className="sheet-header"><div className="sheet-avatar">{character.name.slice(0, 2).toUpperCase()}<span>#{character.crawler_number.toLocaleString()}</span></div><div><p className="eyebrow">Crawler profile</p><h2>{character.name}</h2><p>{character.race} · {character.class_name} · Level {character.level}</p></div><div className="sheet-tags"><span>Floor {character.floor}</span><span>{character.size_name} ({character.size_value})</span></div></div>
    <div className="stat-grid">{statLabels.map(([key, label]) => { const value = character[key]; return <article key={key}><small>{label}</small><strong>{value}</strong><span>{displayMod(value)}</span><em>Enhanced</em></article> })}</div>
    <div className="vitals-grid"><article><div><small>Health bar</small><strong>{10 - character.health_slots_lost}/10 slots</strong></div><div className="health-track">{Array.from({ length: 10 }, (_, index) => <i key={index} className={index >= 10 - character.health_slots_lost ? 'lost' : ''}><span>{healthValue}</span></i>)}</div></article><article><small>Mana</small><strong>{character.current_mana}</strong><span>Max {character.intelligence}</span></article><article><small>Evade</small><strong>d20 {displayMod(character.dexterity)}</strong><span>DEX modifier</span></article><article><small>AI Favor</small><strong>{character.ai_favor}</strong><span>Spend wisely</span></article></div>
    <div className="sheet-columns"><section className="panel inset"><div className="panel-heading"><div><p className="eyebrow">Checks & attacks</p><h3>Skills</h3></div><span className="count-badge">{character.skills.length}</span></div>{character.skills.length ? <div className="skill-list">{character.skills.map((skill) => <div key={skill.id}><span><strong>{skill.name}</strong><small>{skill.check_type} · {skill.stat ?? 'Passive'}</small></span><b>Rank {skill.rank}</b><em>{skill.advancement_marked ? '✓' : '○'}</em></div>)}</div> : <p className="empty-copy">No skills recorded yet.</p>}</section><section className="panel inset"><div className="panel-heading"><div><p className="eyebrow">Quick access</p><h3>Hotlist</h3></div><span className="count-badge">0/10</span></div><div className="hotlist-grid">{Array.from({ length: 10 }, (_, index) => <button key={index}><small>{index + 1}</small>{index === 0 ? <><strong>Heal</strong><span>2 Mana</span></> : <em>Empty</em>}</button>)}</div></section></div>
  </section>
}

function Campaigns({ campaigns, onCreate }: { campaigns: Campaign[]; onCreate: () => void }) {
  return <div className="content"><section className="section-intro"><div><p className="eyebrow">Shared adventures</p><h2>Campaign control</h2><p>Manage floors, parties, and the stories your crawlers probably won't survive.</p></div><button className="primary-button" onClick={onCreate}>+ New campaign</button></section>{campaigns.length ? <div className="campaign-grid">{campaigns.map((campaign) => <article className="campaign-card" key={campaign.id}><div className="campaign-art"><span>F{campaign.floor}</span><div /></div><div className="campaign-body"><span className="status-pill">{campaign.status}</span><h3>{campaign.name}</h3><p>{campaign.description || 'No briefing has been added.'}</p><footer><span><strong>{campaign.member_count}</strong> members</span><span><strong>{campaign.character_count}</strong> crawlers</span></footer></div></article>)}</div> : <section className="panel"><EmptyState title="No active campaigns" body="Create a campaign, choose its current floor, and invite your party later." action="Create campaign" onAction={onCreate} /></section>}</div>
}

function Compendium() {
  const categories = [['Skills', 'Attack, utility, and passive abilities', '60+'], ['Spells', 'Mana costs, ranks, and effects', 'Coming next'], ['Races & Classes', 'Prerequisites, benefits, and drawbacks', 'Coming next'], ['Gear & Loot', 'Weapons, armor, consumables, and boxes', 'Coming next']]
  return <div className="content"><section className="section-intro"><div><p className="eyebrow">Structured rules</p><h2>Compendium foundation</h2><p>This area will contain concise, licensed rules data with references back to the sourcebook—not a reproduction of the book.</p></div></section><div className="compendium-grid">{categories.map(([title, body, count], index) => <article key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{body}</p></div><em>{count}</em></article>)}</div></div>
}

function EmptyState({ title, body, action, onAction }: { title: string; body: string; action: string; onAction: () => void }) {
  return <div className="empty-state"><div>+</div><h3>{title}</h3><p>{body}</p><button className="primary-button" onClick={onAction}>{action}</button></div>
}

export default App
