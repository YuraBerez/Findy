import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/', '.astro/', 'coverage/', 'test-results/', 'playwright-report/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['**/*.{ts,mjs,mts}'], languageOptions: { globals: globals.node } },
  {
    // Pure logic: no Node, no Astro, so the browser script and the tests can use it
    files: ['src/lib/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['node:*', 'astro', 'astro:*'], message: 'src/lib is pure.' }] },
      ],
    },
  },
)
