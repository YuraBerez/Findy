import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { EMPTY_FORM, type ValidApplication } from '@domain/forms'
import { isHttpUrl } from '@domain/limits'
import { firstVisibleStage, visibleStages, type StageId } from '@domain/stages'
import type { VacancyData } from '@shared/ipc'
import { Button, Dialog } from '@ui'
import { ApplicationFields } from '../ApplicationFields'
import { useApplicationForm } from '../useApplicationForm'
import { useVacancyFill } from '../useVacancyFill'

interface Props {
  hiddenStages: StageId[]
  onClose(): void
  /** Closing on success is the caller's job; a failure is notified there */
  onSubmit(application: ValidApplication): Promise<void>
  /** Spec 009: title and company of a vacancy page; null when there are none */
  onReadVacancy(url: string): Promise<VacancyData | null>
}

/** US-1: create an application. Mount it to open it; the form starts empty each time. */
export function ApplicationDialog({ hiddenStages, onClose, onSubmit, onReadVacancy }: Props) {
  const { t } = useTranslation()
  // FR-007: start in the first visible column
  const form = useApplicationForm({ ...EMPTY_FORM, stage: firstVisibleStage(hiddenStages) })
  const [saving, setSaving] = useState(false)
  const vacancy = useVacancyFill(onReadVacancy, form.fillEmpty)
  const vacancyStatus = {
    idle: '',
    reading: t('form.vacancy.reading'),
    filled: t('form.vacancy.filled'),
    notFound: t('form.vacancy.notFound'),
  }[vacancy.status]

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = form.validate(event)
    if (!data) return
    setSaving(true)
    try {
      await onSubmit(data)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      title={t('form.createTitle')}
      closeLabel={t('common.close')}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <Button onClick={onClose}>{t('form.cancel')}</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {t('form.create')}
          </Button>
        </>
      }
    >
      <ApplicationFields
        form={form}
        stages={visibleStages(hiddenStages)}
        link={{
          status: vacancyStatus,
          // FR-001: a paste reads the page; any other change forgets the last read (FR-007)
          onInput: (value, pasted) => {
            vacancy.reset()
            if (pasted) void vacancy.start(value)
          },
          action: (
            <Button
              size="small"
              disabled={!isHttpUrl(form.values.url.trim()) || vacancy.status === 'reading'}
              onClick={() => void vacancy.start(form.values.url)}
            >
              {t('form.vacancy.fill')}
            </Button>
          ),
        }}
      />
    </Dialog>
  )
}
