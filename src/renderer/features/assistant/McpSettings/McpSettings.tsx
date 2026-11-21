import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { McpConnection } from '@shared/ipc'
import { skillInstallCommand } from '@shared/skill'
import { Button, CodeBlock, ExternalLinkIcon, Switch } from '@ui'
import styles from './McpSettings.module.css'

interface Props {
  enabled: boolean
  onChange(enabled: boolean): void
  /** Spec 004 FR-009: null when it failed (already notified) */
  loadConnection(): Promise<McpConnection | null>
  /** Spec 016 FR-021 */
  onSaveSkill(): void
  /** Spec 016 FR-023: the README steps in the browser */
  onOpenInstall(): void
}

/** Spec 017 FR-004: Electron's user agent names Windows on Windows */
const shell = navigator.userAgent.includes('Windows') ? 'powershell' : 'posix'

const quote = (value: string) => (/[\s"]/.test(value) ? JSON.stringify(value) : value)

/**
 * Spec 004 US-1, FR-009: turn assistant access on/off and show how to connect; spec 016: the
 * skill. A page of the settings window (spec 018 D-3).
 */
export function McpSettings({
  enabled,
  onChange,
  loadConnection,
  onSaveSkill,
  onOpenInstall,
}: Props) {
  const { t } = useTranslation()
  const [connection, setConnection] = useState<McpConnection | null>(null)

  useEffect(() => {
    void loadConnection().then(setConnection)
  }, [loadConnection])

  const copy = { copyLabel: t('mcp.copy'), copiedLabel: t('mcp.copied') }

  return (
    <>
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
            code={[
              'claude mcp add findy',
              ...Object.entries(connection.env).map(([key, value]) => `-e ${key}=${value}`),
              '--',
              ...[connection.command, ...connection.args].map(quote),
            ].join(' ')}
            {...copy}
          />
          {/* MCP is an open standard: any client with stdio servers can connect */}
          <h3 className={styles.heading}>{t('mcp.otherTitle')}</h3>
          <p className={styles.hint}>{t('mcp.otherHint')}</p>
          <CodeBlock
            label={t('mcp.otherTitle')}
            code={[
              `command:   ${connection.command}`,
              `args:      ${connection.args.map(quote).join(' ')}`,
              ...Object.entries(connection.env).map(([key, value]) => `env:       ${key}=${value}`),
              'transport: stdio',
            ].join('\n')}
          />
        </>
      )}
      {/* Spec 016 FR-020, FR-022: also with access off, so the user can prepare */}
      <h3 className={styles.heading}>{t('mcp.skillTitle')}</h3>
      <p className={styles.hint}>{t('mcp.skillHint')}</p>
      {/* Spec 017 FR-004, FR-005: one command for this system, also with access off */}
      <p className={styles.hint}>{t('mcp.skillCodeHint')}</p>
      <CodeBlock
        testId="skill-install-command"
        label={t('mcp.skillCodeTitle')}
        code={skillInstallCommand(shell)}
        {...copy}
      />
      <p className={styles.hint}>{t('mcp.skillDesktopHint')}</p>
      <div className={styles.actions}>
        <Button onClick={onSaveSkill}>{t('mcp.saveSkill')}</Button>
        <Button variant="ghost" onClick={onOpenInstall}>
          <ExternalLinkIcon size={14} />
          {t('mcp.skillInstall')}
        </Button>
      </div>
    </>
  )
}
