import { useState, type InputHTMLAttributes } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: string }

export default function PasswordField({ label, ...inputProps }: Props) {
  const [visible, setVisible] = useState(false)
  return <label>{label}<span className="password-control"><input {...inputProps} type={visible ? 'text' : 'password'} /><button type="button" aria-pressed={visible} aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} onClick={() => setVisible((current) => !current)}>{visible ? 'Hide' : 'Show'}</button></span></label>
}
