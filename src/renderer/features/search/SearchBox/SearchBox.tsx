import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchIcon } from '@ui'
import styles from './SearchBox.module.css'

interface Props {
  value: string
  onChange(value: string): void
}

/** FR-060: filter the board. Cmd/Ctrl+F focuses it, Escape clears it. */
export function SearchBox({ value, onChange }: Props) {
  const { t } = useTranslation()
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const focus = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        ref.current?.focus()
        ref.current?.select()
      }
    }
    window.addEventListener('keydown', focus)
    return () => window.removeEventListener('keydown', focus)
  }, [])

  return (
    <div className={styles.box}>
      <SearchIcon size={15} className={styles.icon} />
      <input
        ref={ref}
        type="search"
        className={styles.input}
        aria-label={t('search.label')}
        placeholder={t('search.placeholder')}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value) {
            event.preventDefault()
            onChange('')
          }
        }}
      />
    </div>
  )
}
