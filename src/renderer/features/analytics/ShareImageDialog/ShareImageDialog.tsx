import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Dialog } from '@ui'
import type { ShareCard } from '../shareImage'
import styles from './ShareImageDialog.module.css'

interface Props {
  card: ShareCard
  /** `data:` URL of the PNG */
  url: string
  onCopy(): Promise<void>
  onSave(): Promise<void>
  onClose(): void
}

/** Spec 023 FR-020…FR-024: the preview, Copy, Save as PNG and Close */
export function ShareImageDialog({ card, url, onCopy, onSave, onClose }: Props) {
  const { t } = useTranslation()
  // One action at a time; the dialog stays open after it, also after a failure (FR-023)
  const [busy, setBusy] = useState(false)
  const run = (action: () => Promise<void>) => async () => {
    setBusy(true)
    try {
      await action()
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog
      title={t('analytics.share.title')}
      closeLabel={t('analytics.share.close')}
      onClose={onClose}
      testId="share-image"
      footer={
        <>
          <Button onClick={onClose}>{t('analytics.share.close')}</Button>
          <Button onClick={run(onSave)} disabled={busy}>
            {t('analytics.share.save')}
          </Button>
          <Button variant="primary" onClick={run(onCopy)} disabled={busy} autoFocus>
            {t('analytics.share.copy')}
          </Button>
        </>
      }
    >
      <img
        className={styles.image}
        src={url}
        alt={t('analytics.share.alt', { period: card.period })}
        aria-describedby="share-image-text"
      />
      <div id="share-image-text" className={styles.text} data-testid="share-image-text">
        <p>
          {card.title} · {card.subtitle} · {card.period}
        </p>
        <dl>
          {card.tiles.map((tile) => (
            <div key={tile.label}>
              <dt>{tile.label}</dt>
              <dd>{tile.value}</dd>
            </div>
          ))}
        </dl>
        <p>{card.funnelTitle}</p>
        <ol>
          {card.funnel.map((row) => (
            <li key={row.stage}>
              {row.label}: {row.count} ({row.share})
            </li>
          ))}
        </ol>
        <p>{card.site}</p>
      </div>
    </Dialog>
  )
}
