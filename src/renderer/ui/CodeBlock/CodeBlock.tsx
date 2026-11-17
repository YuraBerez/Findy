import { useState } from 'react'
import { Button } from '../Button'
import styles from './CodeBlock.module.css'

interface Props {
  code: string
  /** Accessible name of the block, e.g. "Claude Desktop configuration" */
  label: string
  /** With labels, a Copy button is shown */
  copyLabel?: string
  copiedLabel?: string
  testId?: string
}

/** Code to read or copy. Focusable, so a wide block scrolls with the keyboard. */
export function CodeBlock({ code, label, copyLabel, copiedLabel, testId }: Props) {
  const [copied, setCopied] = useState(false)
  return (
    <div className={styles.block}>
      <pre className={styles.code} tabIndex={0} aria-label={label} data-testid={testId}>
        {code}
      </pre>
      {copyLabel && (
        <Button
          size="small"
          onClick={async () => {
            await navigator.clipboard.writeText(code)
            setCopied(true)
          }}
        >
          {copied ? copiedLabel : copyLabel}
        </Button>
      )}
    </div>
  )
}
