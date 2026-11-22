import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import { e2eLayerRules } from 'playwright-e2e-kit/eslint'
import tseslint from 'typescript-eslint'

const FEATURE_TO_APP = 'features/ import no app/ (D-7).'
const FEATURE_INTERNALS = 'Import another feature only through its index.ts (D-7).'

/**
 * The import rules of the renderer, plus the rules of one layer. Flat config replaces a
 * rule for the matching files, so every layer repeats the common ones.
 */
function restrictImports(...layer) {
  return [
    'error',
    {
      patterns: [
        {
          group: ['electron', 'node:*', 'better-sqlite3'],
          message: 'Renderer must use window.findy only (docs/contracts/ipc.md).',
        },
        {
          group: ['zod', '@domain/schema', '**/domain/schema'],
          message: 'zod stays out of the renderer: the CSP blocks it (D-6). Use domain/limits.',
        },
        ...layer,
      ],
    },
  ]
}

export default tseslint.config(
  {
    ignores: [
      'out/',
      'dist/',
      'extension/dist/',
      'coverage/',
      'test-results/',
      'playwright-report/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-restricted-imports': restrictImports(),
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='window'][property.name='findy']",
          message: 'Call IPC only through app/useAppState.ts (docs/architecture.md D-7).',
        },
      ],
    },
  },
  {
    // D-7: the IPC layer, and the first state before React starts
    files: ['src/renderer/app/useAppState.ts', 'src/renderer/main.tsx'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['src/renderer/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrictImports(
        {
          group: ['react-i18next', 'i18next', '@domain/*', '@shared/*'],
          message: 'ui/ takes text and data as props: no i18n, domain or IPC types (D-7).',
        },
        {
          regex: '^(\\.\\./)+(app|features|hooks)(/|$)',
          message: 'ui/ is the lowest layer: it imports no app/, features/ or hooks/ (D-7).',
        },
      ),
    },
  },
  {
    files: ['src/renderer/hooks/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrictImports({
        regex: '^(\\.\\./)+(app|features)(/|$)',
        message: 'hooks/ imports no app/ or features/ (D-7).',
      }),
    },
  },
  {
    files: ['src/renderer/features/*/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrictImports(
        { regex: '^\\.\\./\\.\\./app(/|$)', message: FEATURE_TO_APP },
        { regex: '^\\.\\./(?!\\.\\.)[^/]+/.+', message: FEATURE_INTERNALS },
      ),
    },
  },
  {
    files: ['src/renderer/features/*/*/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrictImports(
        { regex: '^\\.\\./\\.\\./\\.\\./app(/|$)', message: FEATURE_TO_APP },
        { regex: '^\\.\\./\\.\\./(?!\\.\\.)[^/]+/.+', message: FEATURE_INTERNALS },
      ),
    },
  },
  {
    // Spec 019: the browser extension. No network (NFR-001), no Node or Electron, and the
    // same React rules as the renderer.
    files: ['extension/src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-restricted-imports': restrictImports(),
      'no-restricted-globals': [
        'error',
        ...['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource'].map((name) => ({
          name,
          message:
            'The extension makes no network requests (constitution §II.9, spec 019 NFR-001).',
        })),
      ],
    },
  },
  {
    // Constitution §VI.2: pure domain logic
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['electron', 'react', 'react-*', 'node:*', 'fs', 'path', 'better-sqlite3'],
              message: 'src/domain is pure: no Electron, React, Node or database.',
            },
            {
              regex: '^(\\.\\./)+(main|preload|renderer)(/|$)',
              message: 'src/domain imports no process code.',
            },
          ],
        },
      ],
    },
  },
  // E2E layers (specs → steps → screens; data only through fixtures)
  ...e2eLayerRules({ unusedVars: '@typescript-eslint/no-unused-vars' }),
  prettier,
)
