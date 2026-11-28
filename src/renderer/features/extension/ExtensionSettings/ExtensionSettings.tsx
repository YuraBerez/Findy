import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { extensionFileUrl, extensionGuideUrl, type ExtensionBuild } from '@shared/extension'
import { Button, ExternalLinkIcon } from '@ui'
import styles from './ExtensionSettings.module.css'

interface Props {
  /** FR-003: the app version for the release files; null when it failed (already notified) */
  loadVersion(): Promise<string | null>
  /** NFR-003: opens an http(s) link in the system browser */
  onOpenLink(url: string): void
}

const BUILDS: ExtensionBuild[] = ['chromium', 'firefox']

/**
 * Spec 024: what the browser extension does, its files for this version and the install
 * guide. A page of the settings window (spec 018). Findy makes no request (FR-005).
 */
export function ExtensionSettings({ loadVersion, onOpenLink }: Props) {
  const { t, i18n } = useTranslation()
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    void loadVersion().then(setVersion)
  }, [loadVersion])

  return (
    <>
      <p>{t('extensionSettings.text')}</p>
      <p className={styles.hint}>{t('extensionSettings.hint')}</p>
      <div className={styles.actions}>
        {BUILDS.map((build) => (
          <Button
            key={build}
            disabled={version === null}
            onClick={() => version && onOpenLink(extensionFileUrl(version, build))}
          >
            {t(`extensionSettings.${build}`)}
          </Button>
        ))}
        <Button
          variant="ghost"
          onClick={() => onOpenLink(extensionGuideUrl(i18n.language === 'uk' ? 'uk' : 'en'))}
        >
          <ExternalLinkIcon size={14} />
          {t('extensionSettings.guide')}
        </Button>
      </div>
    </>
  )
}
