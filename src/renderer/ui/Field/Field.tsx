import { useId, type ReactNode } from 'react'
import styles from './Field.module.css'

/** Props a form control needs to be labelled and described */
export interface ControlProps {
  id: string
  'aria-invalid'?: true
  'aria-describedby'?: string
}

interface Props {
  label: ReactNode
  /** Extra text after the label, e.g. "Optional" */
  hint?: string
  /** Message under the control; marks it invalid */
  error?: string
  id?: string
  children(control: ControlProps): ReactNode
}

/** Label, hint and error around any control, with the ARIA wiring done once. */
export function Field({ label, hint, error, id: givenId, children }: Props) {
  const generated = useId()
  const id = givenId ?? generated
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ')

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {hint && (
          <span id={hintId} className={styles.hint}>
            {' '}
            ({hint})
          </span>
        )}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy || undefined,
      })}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}
