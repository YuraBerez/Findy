import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { McpConnection } from '@shared/ipc'
import { Button, Dialog, Switch } from '@ui'
import styles from './McpDialog.module.css'

interface Props {
  enabled: boolean
  onChange(enabled: boolean): void
  onClose(): void
}

const quote = (value: string) => (/[\s"]/.test(value) ? JSON.stringify(value) : value)

/** Spec 004 US-1, FR-009: turn assistant access on/off and show how to connect. */
export function McpDialog({ enabled, onChange, onClose }: Props) {
  const { t } = useTranslation()
  const [connection, setConnection] = useState<McpConnection | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    void window.findy.getMcpConnection().then(setConnection)
  }, [])

  const desktop = connection && JSON.stringify({ mcpServers: { findy: connection } }, null, 2)
  const code =
    connection &&
    `claude mcp add findy -- ${[connection.command, ...connection.args].map(quote).join(' ')}`

  const copy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
  }

  return (
    <Dialog title={t('mcp.title')} closeLabel={t('common.close')} onClose={onClose}>
      <div className={styles.row}>
        <span className={styles.label}>{t('mcp.allow')}</span>
        <Switch checked={enabled} label={t('mcp.allow')} onToggle={() => onChange(!enabled)} />
      </div>
      <p className={styles.hint}>{t('mcp.privacy')}</p>
      {enabled && desktop && code && (
        <>
          <h3 className={styles.heading}>{t('mcp.desktopTitle')}</h3>
          <p className={styles.hint}>{t('mcp.desktopHint')}</p>
          <pre className={styles.code} data-testid="mcp-desktop-config">
            {desktop}
          </pre>
          <Button size="small" onClick={() => void copy('desktop', desktop)}>
            {copied === 'desktop' ? t('mcp.copied') : t('mcp.copy')}
          </Button>
          <h3 className={styles.heading}>{t('mcp.codeTitle')}</h3>
          <pre className={styles.code}>{code}</pre>
          <Button size="small" onClick={() => void copy('code', code)}>
            {copied === 'code' ? t('mcp.copied') : t('mcp.copy')}
          </Button>
          {/* MCP is an open standard: any client with stdio servers can connect */}
          <h3 className={styles.heading}>{t('mcp.otherTitle')}</h3>
          <p className={styles.hint}>{t('mcp.otherHint')}</p>
          <pre
            className={styles.code}
          >{`command: ${connection.command}\nargs:    ${connection.args.join(' ')}\ntransport: stdio`}</pre>
        </>
      )}
    </Dialog>
  )
}
