import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AnalyticsData, AnalyticsPeriod } from '@domain/analytics'
import { Button, ImageIcon } from '@ui'
import logo from '../../../../../assets/logo.svg'
import { buildShareCard, renderShareImage, type ShareCard } from '../shareImage'
import { ShareImageDialog } from '../ShareImageDialog'

interface Props {
  data: Pick<AnalyticsData, 'totals' | 'funnel' | 'searchDays'>
  period: AnalyticsPeriod
  /** FR-021: the PNG to the clipboard */
  onCopy(png: Uint8Array): Promise<void>
  /** FR-022: the PNG through the save dialog */
  onSave(png: Uint8Array): Promise<void>
}

/** Spec 023 FR-001, FR-003, FR-025: makes the image from the numbers at the moment of the click */
export function ShareImageButton({ data, period, onCopy, onSave }: Props) {
  const { t, i18n } = useTranslation()
  const [image, setImage] = useState<{ card: ShareCard; png: Uint8Array; url: string } | null>(null)
  // A failed drawing rejects, and the global handler shows it (spec 003 FR-005)
  const open = async () => {
    const card = buildShareCard(data, period, t, i18n.language)
    setImage({ card, ...(await renderShareImage(card, logo)) })
  }
  return (
    <>
      <Button onClick={open}>
        <ImageIcon size={14} />
        {t('analytics.share.button')}
      </Button>
      {image && (
        <ShareImageDialog
          card={image.card}
          url={image.url}
          onCopy={() => onCopy(image.png)}
          onSave={() => onSave(image.png)}
          onClose={() => setImage(null)}
        />
      )}
    </>
  )
}
