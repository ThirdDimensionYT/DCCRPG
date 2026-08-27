import { useState, type FormEvent } from 'react'
import { changePassword, type User } from './api'
import PasswordField from './PasswordField'

export default function AccountSettings({ user }: { user: User }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const currentPassword = String(form.get('currentPassword') ?? '')
    const newPassword = String(form.get('newPassword') ?? '')
    if (newPassword !== String(form.get('confirmPassword') ?? '')) {
      setError('New passwords do not match.')
      setSuccess(false)
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await changePassword({ currentPassword, newPassword })
      formElement.reset()
      setSuccess(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not change your password.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="content account-settings">
    <section className="section-intro"><div><p className="eyebrow">Crawler credentials</p><h2>My account</h2><p>Signed in as @{user.username}. Change your own password whenever you need to.</p></div></section>
    <section className="panel account-card">
      <div className="panel-heading"><div><p className="eyebrow">Security</p><h3>Change password</h3></div></div>
      {error ? <div className="auth-error account-message">{error}</div> : null}
      {success ? <div className="success-banner account-message">Password changed. Your other signed-in sessions have been closed.</div> : null}
      <form className="admin-form" onSubmit={(event) => void submit(event)}>
        <PasswordField label="Current password" name="currentPassword" required maxLength={128} autoComplete="current-password" />
        <PasswordField label="New password" name="newPassword" required minLength={12} maxLength={128} autoComplete="new-password" />
        <PasswordField label="Confirm new password" name="confirmPassword" required minLength={12} maxLength={128} autoComplete="new-password" />
        <p className="form-note">Use at least 12 characters. The owner can still reset your password if you forget it.</p>
        <button className="primary-button" disabled={saving}>{saving ? 'Changing…' : 'Change password'}</button>
      </form>
    </section>
  </div>
}
