import { Fragment, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { StageId } from '@domain/stages'
import { Field, Select, TextField } from '@ui'
import type { ApplicationFormState } from '../useApplicationForm'
import styles from './ApplicationFields.module.css'

const TEXT_FIELDS = ['title', 'company', 'url'] as const

/** Fields of an application (FR-010, FR-012), for the create dialog and the details panel. */
interface Props {
  form: ApplicationFormState
  /** Stages to offer: the visible ones (spec 002 FR-005) */
  stages: readonly StageId[]
  /** Spec 009, add dialog only: status, change handler and an action of the link field */
  link?: {
    status: string
    /** After the form took the new value; `pasted` when a paste changed it */
    onInput(value: string, pasted: boolean): void
    action: ReactNode
  }
}

export function ApplicationFields({ form, stages, link }: Props) {
  const { t } = useTranslation()
  // A paste is followed by its change event in the same task; then the flag is cleared
  const pasted = useRef(false)
  const labels = { title: t('form.title'), company: t('form.company'), url: t('form.url') }
  return (
    <>
      {TEXT_FIELDS.map((field) => {
        const linkField = field === 'url' ? link : undefined
        return (
          <Fragment key={field}>
            <TextField
              name={field}
              type={field === 'url' ? 'url' : 'text'}
              label={labels[field]}
              hint={field === 'url' ? t('form.urlHint') : undefined}
              value={form.values[field]}
              error={form.errorText(field)}
              status={linkField?.status}
              autoComplete="off"
              onPaste={
                linkField &&
                (() => {
                  pasted.current = true
                  setTimeout(() => (pasted.current = false))
                })
              }
              onChange={(event) => {
                form.set(field, event.target.value)
                linkField?.onInput(event.target.value, pasted.current)
                pasted.current = false
              }}
            />
            {linkField && <div className={styles.linkAction}>{linkField.action}</div>}
          </Fragment>
        )
      })}
      <Field label={t('form.stage')}>
        {(control) => (
          <Select
            {...control}
            block
            name="stage"
            value={form.values.stage}
            onChange={(event) => form.set('stage', event.target.value as StageId)}
          >
            {/* Keep the current stage selectable even if its column was hidden meanwhile */}
            {(stages.includes(form.values.stage) ? stages : [form.values.stage, ...stages]).map(
              (stage) => (
                <option key={stage} value={stage}>
                  {t(`stages.${stage}`)}
                </option>
              ),
            )}
          </Select>
        )}
      </Field>
    </>
  )
}
