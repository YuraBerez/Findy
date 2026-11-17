import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { McpConnection } from '@shared/ipc'
import { CodeBlock, Dialog, Switch } from '@ui'
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

  useEffect(() => {
    void window.findy.getMcpConnection().then(setConnection)
  }, [])

  const copy = { copyLabel: t('mcp.copy'), copiedLabel: t('mcp.copied') }

  return (
    <Dialog title={t('mcp.title')} closeLabel={t('common.close')} onClose={onClose}>
      <div className={styles.row}>
        <span className={styles.label}>{t('mcp.allow')}</span>
        <Switch checked={enabled} label={t('mcp.allow')} onToggle={() => onChange(!enabled)} />
      </div>
      <p className={styles.hint}>{t('mcp.privacy')}</p>
      {enabled && connection && (
        <>
          <h3 className={styles.heading}>{t('mcp.desktopTitle')}</h3>
          <p className={styles.hint}>{t('mcp.desktopHint')}</p>
          <CodeBlock
            testId="mcp-desktop-config"
            label={t('mcp.desktopTitle')}
            code={JSON.stringify({ mcpServers: { findy: connection } }, null, 2)}
            {...copy}
          />
          <h3 className={styles.heading}>{t('mcp.codeTitle')}</h3>
          <CodeBlock
            label={t('mcp.codeTitle')}
            code={`claude mcp add findy -- ${[connection.command, ...connection.args].map(quote).join(' ')}`}
            {...copy}
          />
          {/* MCP is an open standard: any client with stdio servers can connect */}
          <h3 className={styles.heading}>{t('mcp.otherTitle')}</h3>
          <p className={styles.hint}>{t('mcp.otherHint')}</p>
          <CodeBlock
            label={t('mcp.otherTitle')}
            code={`command:   ${connection.command}\nargs:      ${connection.args.join(' ')}\ntransport: stdio`}
          />
        </>
      )}
    </Dialog>
  )
}
