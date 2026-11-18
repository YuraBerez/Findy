import { useEffect } from 'react'

/** Spec 005 FR-001: the two screens of the window, in tab order */
export const VIEWS = ['board', 'analytics'] as const
export type View = (typeof VIEWS)[number]

export const VIEW_ID_PREFIX = 'view'

/** FR-002: Ctrl+1 / Ctrl+2 (Cmd on macOS) open the board and analytics, but not under a modal dialog. */
export function useViewShortcuts(enabled: boolean, onChange: (view: View) => void): void {
  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return
      if (document.querySelector('dialog[open]')) return
      const view = VIEWS[Number(event.key) - 1]
      if (!view) return
      event.preventDefault()
      onChange(view)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, onChange])
}
