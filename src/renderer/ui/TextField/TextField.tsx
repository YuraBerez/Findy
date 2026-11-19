import type { ComponentProps } from 'react'
import { Field } from '../Field'
import styles from './TextField.module.css'

interface BaseProps {
  label: string
  hint?: string
  error?: string
  /** Live text under the control (see Field) */
  status?: string
  hideLabel?: boolean
}

type InputProps = BaseProps & { multiline?: false } & Omit<ComponentProps<'input'>, 'id'>
type TextareaProps = BaseProps & { multiline: true } & Omit<ComponentProps<'textarea'>, 'id'>

/** A labelled text input or textarea. */
export function TextField({
  label,
  hint,
  error,
  status,
  hideLabel,
  multiline,
  ...props
}: InputProps | TextareaProps) {
  return (
    <Field label={label} hint={hint} error={error} status={status} hideLabel={hideLabel}>
      {(control) =>
        multiline ? (
          <textarea
            className={styles.input}
            {...control}
            {...(props as ComponentProps<'textarea'>)}
          />
        ) : (
          <input className={styles.input} {...control} {...(props as ComponentProps<'input'>)} />
        )
      }
    </Field>
  )
}
