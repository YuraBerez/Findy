import { useSyncExternalStore } from 'react'

const query = () => window.matchMedia('(prefers-color-scheme: dark)')

function subscribe(onChange: () => void): () => void {
  const media = query()
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

/**
 * The theme that is actually shown. Main sets nativeTheme.themeSource, so this
 * follows the OS until the user flips the toggle (FR-080).
 */
export function usePrefersDark(): boolean {
  return useSyncExternalStore(subscribe, () => query().matches)
}
