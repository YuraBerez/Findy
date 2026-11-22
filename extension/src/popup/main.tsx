import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import { resolveLanguage } from '@domain/language'
import { createI18n } from '@shared/i18n'
import { nativeSend } from '../native'
import { Popup } from './Popup'
import '../../../src/renderer/styles/global.css'

// NFR-006: the language of the browser, Ukrainian or English
const language = resolveLanguage(null, chrome.i18n.getUILanguage())
document.documentElement.lang = language

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nextProvider i18n={createI18n(language, [initReactI18next])}>
      <Popup send={nativeSend()} />
    </I18nextProvider>
  </StrictMode>,
)
