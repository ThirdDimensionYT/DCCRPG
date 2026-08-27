import { useState, type FormEvent } from 'react'
import { login, setupAdmin } from './api'
import PasswordField from './PasswordField'

function Logo() {
  return <div className="brand-mark auth-logo" aria-hidden="true"><span>D</span></div>
}

export default function AuthScreen({ setupRequired, onAuthenticated }: { setupRequired: boolean; onAuthenticated: () => Promise<void> }) {
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSaving(true)
    setError(null)
    try {
      if (setupRequired) {
        const password = String(form.get('password') ?? '')
        if (password !== String(form.get('confirmPassword') ?? '')) throw new Error('Passwords do not match.')
        await setupAdmin({
          setupToken: String(form.get('setupToken') ?? ''),
          username: String(form.get('username') ?? ''),
          displayName: String(form.get('displayName') ?? ''),
          password,
        })
      } else {
        await login({ username: String(form.get('username') ?? ''), password: String(form.get('password') ?? '') })
      }
      await onAuthenticated()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Authentication failed.')
    } finally {
      setSaving(false)
    }
  }

  return <main className="auth-page">
    <section className="auth-card">
      <Logo />
      <p className="eyebrow">Dungeon Crawler Carl RPG</p>
      <h1>{setupRequired ? 'Initialize game master' : 'Crawler login'}</h1>
      <p className="auth-intro">{setupRequired ? 'Create the first administrator account. This setup closes permanently once complete.' : 'Enter the credentials supplied by your game master.'}</p>
      {error ? <div className="auth-error" role="alert">{error}</div> : null}
      <form onSubmit={submit}>
        {setupRequired ? <PasswordField label="Temporary setup token" name="setupToken" required autoComplete="off" /> : null}
        {setupRequired ? <label>Display name<input name="displayName" required maxLength={80} autoComplete="name" placeholder="George" /></label> : null}
        <label>Username<input name="username" required minLength={3} maxLength={32} autoCapitalize="none" autoComplete="username" placeholder="crawler-name" /></label>
        <PasswordField label="Password" name="password" required minLength={12} maxLength={128} autoComplete={setupRequired ? 'new-password' : 'current-password'} />
        {setupRequired ? <PasswordField label="Confirm password" name="confirmPassword" required minLength={12} maxLength={128} autoComplete="new-password" /> : null}
        <button className="primary-button" disabled={saving}>{saving ? 'Authorizing…' : setupRequired ? 'Create administrator' : 'Enter the dungeon'}</button>
      </form>
      <small className="auth-footnote">Passwords are securely hashed. Your game master can reset access but cannot view existing passwords.</small>
    </section>
  </main>
}
