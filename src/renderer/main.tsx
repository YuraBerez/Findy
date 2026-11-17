import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import { resolveLanguage } from '../domain/language'
import { App } from './components/App'
import { createRendererI18n } from './i18n'
import './styles/global.css'

async function bootstrap(): Promise<void> {
  const [state, systemLocale] = await Promise.all([
    window.findy.getState(),
    window.findy.getSystemLocale(),
  ])
  const language = resolveLanguage(state.settings.language, systemLocale)
  const i18n = createRendererI18n(language)
  document.documentElement.lang = language

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <I18nextProvider i18n={i18n}>
        <App initialState={state} />
      </I18nextProvider>
    </StrictMode>,
  )
}

void bootstrap()
