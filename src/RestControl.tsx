import { useRef } from 'react'
import type { CharacterResourceAction } from './api'

type RestType = Extract<CharacterResourceAction, { action: 'rest' }>['restType']

const rests: Array<{ id: RestType; name: string; duration: string; effect: string }> = [
  { id: 'short', name: 'Short Rest', duration: '2 hours', effect: 'Restore 5 Health slots and half maximum Mana. Clear ordinary Minor Injuries.' },
  { id: 'long', name: 'Long Rest', duration: '8 hours', effect: 'Fully restore Health and Mana. Clear Fatigued and eligible Injuries.' },
  { id: 'full-day', name: 'Full Day Rest', duration: '30 hours', effect: 'Fully restore Health and Mana. Clear Fatigued and long-term Injuries.' },
]

export default function RestControl({ saving, onRest }: { saving: boolean; onRest: (restType: RestType) => Promise<unknown> }) {
  const dialog = useRef<HTMLDialogElement>(null)

  async function choose(restType: RestType) {
    try {
      await onRest(restType)
      dialog.current?.close()
    } catch {
      // The sheet-level error banner presents the server response; keep this menu open for another choice.
    }
  }

  return <>
    <button type="button" className="mana-action rest-trigger" disabled={saving} onClick={() => dialog.current?.showModal()}>Rest…</button>
    <dialog ref={dialog} className="modal rest-modal">
      <div className="modal-heading"><div><p className="eyebrow">Rulebook recovery</p><h2>Choose a Rest</h2></div><button type="button" onClick={() => dialog.current?.close()}>×</button></div>
      <p className="rest-intro">The selected rest’s Health, Mana, Fatigued, and Injury recovery will be applied immediately.</p>
      <div className="rest-options">
        {rests.map((rest) => <button key={rest.id} type="button" disabled={saving} onClick={() => void choose(rest.id)}>
          <span><strong>{rest.name}</strong><small>{rest.duration}</small></span><p>{rest.effect}</p><em>Apply →</em>
        </button>)}
      </div>
      <div className="modal-actions"><button type="button" className="ghost-button" onClick={() => dialog.current?.close()}>Cancel</button></div>
    </dialog>
  </>
}
