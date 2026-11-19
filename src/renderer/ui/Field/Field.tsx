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
  /**
   * Live text under the control that describes it, e.g. progress. Pass '' while there is
   * nothing to say: a live region must exist before its text changes to be announced.
   */
  status?: string
  id?: string
  /** Keep the label for assistive technology only, when the context already says it */
  hideLabel?: boolean
  children(control: ControlProps): ReactNode
}

/** Label, hint and error around any control, with the ARIA wiring done once. */
export function Field({
  label,
  hint,
  error,
  status,
  id: givenId,
  hideLabel = false,
  children,
}: Props) {
  const generated = useId()
  const id = givenId ?? generated
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const statusId = status ? `${id}-status` : undefined
  const describedBy = [errorId, statusId, hintId].filter(Boolean).join(' ')

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={hideLabel ? styles.hidden : styles.label}>
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
      {status !== undefined && (
        <p id={`${id}-status`} className={styles.status} role="status">
          {status}
        </p>
      )}
    </div>
  )
}
