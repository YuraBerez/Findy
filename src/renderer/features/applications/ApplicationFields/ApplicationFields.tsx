import { useTranslation } from 'react-i18next'
import type { StageId } from '@domain/stages'
import { Field, Select, TextField } from '@ui'
import type { ApplicationFormState } from '../useApplicationForm'

const TEXT_FIELDS = ['title', 'company', 'url'] as const

/** Fields of an application (FR-010, FR-012), for the create dialog and the details panel. */
interface Props {
  form: ApplicationFormState
  /** Stages to offer: the visible ones (spec 002 FR-005) */
  stages: readonly StageId[]
}

export function ApplicationFields({ form, stages }: Props) {
  const { t } = useTranslation()
  const labels = { title: t('form.title'), company: t('form.company'), url: t('form.url') }
  return (
    <>
      {TEXT_FIELDS.map((field) => (
        <TextField
          key={field}
          name={field}
          type={field === 'url' ? 'url' : 'text'}
          label={labels[field]}
          hint={field === 'url' ? t('form.urlHint') : undefined}
          value={form.values[field]}
          error={form.errorText(field)}
          autoComplete="off"
          onChange={(event) => form.set(field, event.target.value)}
        />
      ))}
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
