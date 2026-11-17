import { Component, type ReactNode } from 'react'
import { Translation } from 'react-i18next'
import { Button } from '@ui'
import styles from './ErrorBoundary.module.css'

interface State {
  failed: boolean
}

/** Spec 003 FR-006: a render error shows a way back instead of an empty window. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  override render() {
    if (!this.state.failed) return this.props.children
    return (
      <Translation>
        {(t) => (
          <main className={styles.fallback} role="alert">
            <h1>{t('errors.crashTitle')}</h1>
            <p>{t('errors.crashText')}</p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              {t('errors.reload')}
            </Button>
          </main>
        )}
      </Translation>
    )
  }
}
