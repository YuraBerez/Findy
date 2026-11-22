import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, TextField } from '@ui'
import { DOWNLOAD_URL } from '@shared/project'
import type { Send } from '../../browser/connector'
import { canAdd, loadPopup, submit, type Form, type PopupState } from '../state'
import styles from './Popup.module.css'

interface Props {
  send: Send
}

/** Spec 019 US-1…US-4: the values of the open page, one click to add */
export function Popup({ send }: Props) {
  const { t } = useTranslation()
  const [state, setState] = useState<PopupState>({ kind: 'loading' })
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    void loadPopup(send).then(setState)
  }, [send])

  const change = (field: keyof Form, value: string): void =>
    setState((current) =>
      current.kind === 'ready'
        ? { ...current, form: { ...current.form, [field]: value }, error: null }
        : current,
    )

  const add = (event: FormEvent): void => {
    event.preventDefault()
    if (state.kind !== 'ready' || !canAdd(state)) return
    const saving = { ...state, saving: true }
    setState(saving)
    void submit(send, saving).then(setState)
  }

  return (
    <main className={styles.popup}>
      <h1 className={styles.title}>{t('extension.title')}</h1>
      {state.kind === 'loading' && (
        <p role="status" className={styles.muted}>
          {t('extension.reading')}
        </p>
      )}
      {state.kind === 'unsupported' && <p role="status">{t('extension.unsupported')}</p>}
      {state.kind === 'noFindy' && (
        <div role="alert" className={styles.stack}>
          <p>{t('extension.noFindy')}</p>
          <a href={DOWNLOAD_URL} target="_blank" rel="noreferrer" className={styles.link}>
            {t('extension.download')}
          </a>
        </div>
      )}
      {state.kind === 'added' && (
        <p role="status">{t('extension.added', { stage: t('stages.applied') })}</p>
      )}
      {state.kind === 'ready' && (
        <form className={styles.stack} onSubmit={add} noValidate>
          {state.match && (
            <p role="status" className={styles.match}>
              {t('extension.already', { stage: t(`stages.${state.match}`) })}
            </p>
          )}
          <TextField
            label={t('form.title')}
            value={state.form.title}
            onChange={(event) => change('title', event.target.value)}
            maxLength={200}
            required
            autoFocus={!state.form.title}
          />
          <TextField
            label={t('form.company')}
            value={state.form.company}
            onChange={(event) => change('company', event.target.value)}
            maxLength={200}
            required
          />
          <TextField label={t('form.url')} value={state.form.url} readOnly />
          {state.error && (
            <p role="alert" className={styles.error}>
              {t('extension.failed', { reason: state.error })}
            </p>
          )}
          {!state.form.title.trim() || !state.form.company.trim() ? (
            <p className={styles.muted}>{t('extension.fillIn')}</p>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            disabled={!canAdd(state)}
            autoFocus={!!state.form.title}
          >
            {state.saving
              ? t('extension.adding')
              : state.match
                ? t('extension.addAnyway')
                : t('extension.add')}
          </Button>
        </form>
      )}
    </main>
  )
}
