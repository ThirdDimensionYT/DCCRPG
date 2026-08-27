import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createManagedUser, listManagedUsers, resetManagedUserPassword, setManagedUserActive, type ManagedUser } from './api'
import PasswordField from './PasswordField'

export default function PlayerManagement({ currentUserId, onSignedOut }: { currentUserId: string; onSignedOut: () => Promise<void> }) {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [resettingUser, setResettingUser] = useState<ManagedUser | null>(null)
  const resetDialog = useRef<HTMLDialogElement>(null)

  async function refresh() {
    const result = await listManagedUsers()
    setUsers(result.users)
  }

  useEffect(() => { void refresh().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load accounts.')) }, [])

  async function createPlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setSaving(true)
    setError(null)
    try {
      await createManagedUser({ username: String(form.get('username') ?? ''), displayName: String(form.get('displayName') ?? ''), password: String(form.get('password') ?? '') })
      formElement.reset()
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not create the player account.')
    } finally {
      setSaving(false)
    }
  }

  function openPasswordReset(user: ManagedUser) {
    setResettingUser(user)
    window.requestAnimationFrame(() => resetDialog.current?.showModal())
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!resettingUser) return
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') ?? '')
    if (password !== String(form.get('confirmPassword') ?? '')) {
      setError('Passwords do not match.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const result = await resetManagedUserPassword(resettingUser.id, password)
      resetDialog.current?.close()
      if (result.signedOut) await onSignedOut()
      else window.alert(`Password reset for ${resettingUser.display_name}. Their existing sessions have been signed out.`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not reset the password.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(user: ManagedUser) {
    try {
      await setManagedUserActive(user.id, user.is_active !== 1)
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update the account.')
    }
  }

  return <div className="content player-admin">
    <section className="section-intro"><div><p className="eyebrow">Game Master tools</p><h2>Player access</h2><p>Create individual logins, reset passwords, and revoke access immediately.</p></div></section>
    {error ? <div className="error-banner inline"><strong>Interface alert</strong><span>{error}</span><button onClick={() => setError(null)}>×</button></div> : null}
    <div className="admin-grid">
      <section className="panel">
        <div className="panel-heading"><div><p className="eyebrow">New account</p><h3>Add a player</h3></div></div>
        <form className="admin-form" onSubmit={createPlayer}>
          <label>Display name<input name="displayName" required maxLength={80} placeholder="Player name" /></label>
          <label>Username<input name="username" required minLength={3} maxLength={32} autoCapitalize="none" placeholder="crawler-name" /></label>
          <PasswordField label="Temporary password" name="password" required minLength={12} maxLength={128} autoComplete="new-password" />
          <p className="form-note">Give these credentials directly to the player. You can reset the password later, but cannot retrieve it.</p>
          <button className="primary-button" disabled={saving}>{saving ? 'Creating…' : 'Create player account'}</button>
        </form>
      </section>
      <section className="panel">
        <div className="panel-heading"><div><p className="eyebrow">Authorized crawlers</p><h3>Accounts</h3></div><span className="count-badge">{users.length}</span></div>
        <div className="account-list">
          {users.map((user) => <article key={user.id} className={user.is_active ? '' : 'disabled'}>
            <span className="avatar">{user.display_name.slice(0, 2).toUpperCase()}</span>
            <div><strong>{user.display_name}</strong><small>@{user.username} · {user.role}</small></div>
            <div className="account-actions">
              <button className="ghost-button" onClick={() => openPasswordReset(user)}>Reset password</button>
              {user.id !== currentUserId ? <button className="ghost-button" onClick={() => void toggleActive(user)}>{user.is_active ? 'Disable' : 'Enable'}</button> : null}
            </div>
          </article>)}
        </div>
      </section>
    </div>
    <dialog ref={resetDialog} className="modal password-reset-modal" onClose={() => setResettingUser(null)}>
      {resettingUser ? <form onSubmit={(event) => void resetPassword(event)}>
        <div className="modal-heading"><div><p className="eyebrow">Player access</p><h2>Reset {resettingUser.display_name}'s password</h2></div><button type="button" onClick={() => resetDialog.current?.close()}>×</button></div>
        <PasswordField label="New password" name="password" required minLength={12} maxLength={128} autoComplete="new-password" />
        <PasswordField label="Confirm new password" name="confirmPassword" required minLength={12} maxLength={128} autoComplete="new-password" />
        <p className="form-note">The player will be signed out everywhere when this password is saved.</p>
        <div className="modal-actions"><button type="button" className="ghost-button" onClick={() => resetDialog.current?.close()}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Resetting…' : 'Reset password'}</button></div>
      </form> : null}
    </dialog>
  </div>
}
