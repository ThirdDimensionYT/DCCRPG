import { useState } from 'react'

type BookSection = { id: string; number: string; title: string; bookStart: number; bookEnd: number; pdfPage: number; summary: string }

const chapters: BookSection[] = [
  { id: 'introduction', number: 'Intro', title: 'Introduction', bookStart: 6, bookEnd: 13, pdfPage: 8, summary: 'Roles, the rhythm of play, and preparing for the Crawl.' },
  { id: 'atlas', number: '01', title: 'Atlas', bookStart: 14, bookEnd: 53, pdfPage: 16, summary: 'The World Dungeon, crawler interface, floors, clubs, gods, and crawlers.' },
  { id: 'playing', number: '02', title: 'Playing the Game', bookStart: 54, bookEnd: 99, pdfPage: 56, summary: 'Dice, Stats, Skills, Checks, actions, exploration, vehicles, combat, and Health.' },
  { id: 'creation', number: '03', title: 'Character Creation', bookStart: 100, bookEnd: 171, pdfPage: 102, summary: 'Crawler creation, Race and Class selection, worship, and advancement.' },
  { id: 'skills', number: '04', title: 'Skills, Spells, & Gear', bookStart: 172, bookEnd: 233, pdfPage: 174, summary: 'Skills, Spells, loot, crafting, pets, mounts, and minions.' },
  { id: 'gm', number: '05', title: 'Gamemastering the Dungeon', bookStart: 234, bookEnd: 277, pdfPage: 236, summary: 'Running scenes, quests, neighborhoods, Mobs, Bosses, and player challenges.' },
  { id: 'story', number: '06', title: 'Story Elements', bookStart: 278, bookEnd: 329, pdfPage: 280, summary: 'Popularity, sponsors, interviews, NPCs, deities, patrons, and artifacts.' },
  { id: 'over-city', number: '07', title: 'The Over City', bookStart: 330, bookEnd: 423, pdfPage: 332, summary: 'Third Floor neighborhoods and quests.' },
  { id: 'iron-tangle', number: '08', title: 'The Iron Tangle', bookStart: 424, bookEnd: 521, pdfPage: 426, summary: 'Fourth Floor lines, stations, neighborhoods, and quests.' },
  { id: 'bubbles', number: '09', title: 'The Bubbles', bookStart: 522, bookEnd: 633, pdfPage: 524, summary: 'Fifth Floor quadrants, neighborhoods, and quests.' },
  { id: 'appendices', number: 'App', title: 'Appendices & Rules Index', bookStart: 634, bookEnd: 648, pdfPage: 636, summary: 'Iconic gear, the Royal Court, achievements, and the rules index.' },
]

export default function Rulebook() {
  const [selected, setSelected] = useState(chapters[0])
  const source = `/api/rulebook#page=${selected.pdfPage}&view=FitH`

  return <div className="content rulebook-page">
    <section className="section-intro"><div><p className="eyebrow">Authenticated library</p><h2>Core rulebook</h2><p>Choose a chapter to jump directly to its first page. The PDF is streamed privately to signed-in players and is not stored in the Git repository.</p></div><a className="ghost-button rulebook-open" href={source} target="_blank" rel="noreferrer">Open reader in new tab</a></section>
    <div className="rulebook-layout">
      <aside className="panel rulebook-contents"><div className="panel-heading"><div><p className="eyebrow">Table of contents</p><h3>Chapters</h3></div></div><nav aria-label="Rulebook chapters">{chapters.map((chapter) => <button type="button" key={chapter.id} className={selected.id === chapter.id ? 'selected' : ''} onClick={() => setSelected(chapter)}><span>{chapter.number}</span><div><strong>{chapter.title}</strong><small>Book pages {chapter.bookStart}–{chapter.bookEnd}</small><p>{chapter.summary}</p></div></button>)}</nav></aside>
      <section className="panel rulebook-reader"><header><div><p className="eyebrow">{selected.number === 'Intro' || selected.number === 'App' ? selected.number : `Chapter ${selected.number}`}</p><h3>{selected.title}</h3></div><span>Page {selected.bookStart}</span></header><iframe key={selected.id} src={source} title={`${selected.title} rulebook reader`} /></section>
    </div>
  </div>
}
