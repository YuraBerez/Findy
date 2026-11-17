---
name: localization
description: Rules for user-facing copy in Findy's two locales (en, uk) — where strings live, key and placeholder parity, i18next plurals (Ukrainian one/few/many), dates and relative times through Intl, the native menu, Ukrainian typography and tone, text expansion in the kanban layout. Use whenever a task adds or changes user-visible text, formats a date or number for display, or touches layout that holds text.
---

# /localization — Findy in English and Ukrainian

Apply while you write code, not as a review afterwards. Base rules: `docs/i18n.md`.

## 1. Locales and files

| Locale | Role | File |
|---|---|---|
| `en` | default and fallback, source of truth | `locales/en.json` |
| `uk` | full translation, never partial | `locales/uk.json` |

The renderer (react-i18next) and the main process (native menu, dialogs) use the same
files. Do not add a locale without a spec.

## 2. Messages

- Write the English string first, then the Ukrainian string in the **same change**.
  A key that falls back to English in `uk` must not ship.
- Same key set and same `{{placeholders}}` in both files. The parity test in
  `tests/unit/` fails on a missing key or a different placeholder.
- Key names: `area.element[.state]`, for example `board.addApplication`,
  `notes.deleteConfirm.title`. Stage names: `stages.<stageId>`.
- **Never join sentence fragments in code** (`t('a') + company + t('b')`). Word order in
  Ukrainian is different. Use one message with named placeholders:
  `"card.appliedAt": "Applied {{date}}"` / `"Заявку надіслано {{date}}"`.
- **Plurals:** Ukrainian has the forms `_one`, `_few`, `_many` (plus `_other` for
  fractions). English has `_one` and `_other`. Never write `count === 1 ? … : …`.
  ```json
  "card.notesCount_one":  "{{count}} нотатка",
  "card.notesCount_few":  "{{count}} нотатки",
  "card.notesCount_many": "{{count}} нотаток",
  "card.notesCount_other": "{{count}} нотатки"
  ```
  Test with counts 1, 2, 5, 11, 21, 22, 25.
- **User content is never translated:** job titles, company names, notes, URLs.
- Product name `Findy` is never translated.

## 3. Dates and numbers: always `Intl`

- Dates: `Intl.DateTimeFormat(lang, …)`. Never build `DD.MM.YYYY` by hand.
- "3 days in stage": `Intl.RelativeTimeFormat(lang, { numeric: 'auto' })`.
- Timestamps are stored in UTC and shown in local time.
- Pass formatted strings into messages: `t('card.inStageFor', { duration })`.
- Tests: match formatted output with a regex that accepts any space type, because ICU
  can output U+00A0 or U+202F.

## 4. Native menu and dialogs

- Menu items, `dialog.showMessageBox` texts and the About window come from the same
  locale files through `src/main/i18n.ts`.
- When the language changes, rebuild the menu (`Menu.setApplicationMenu`) at once.
- macOS standard roles (`role: 'copy'`, `'quit'`…) are localized by the OS. Do not add
  keys for them.

## 5. Tone and typography

| Locale | Rules |
|---|---|
| `en` | Sentence case for buttons and titles ("Add application", not "Add Application"). Short, direct. |
| `uk` | Address the user as «ви» (lowercase). Quotes «…». Apostrophe `ʼ` (U+02BC): «імʼя», «пʼять», «обʼєднати». Use the infinitive or imperative for buttons consistently: «Додати заявку», «Зберегти». |
| both | Em dash `—` for asides, single-character ellipsis `…`. |

Use the established terms in both files:

| en | uk |
|---|---|
| Application | Заявка |
| Stage | Етап |
| Note | Нотатка |
| Offer | Офер |
| Rejected | Відмова |

## 6. Text expansion and layout

- Ukrainian text is often 20–40 % longer than English. Long words are common
  («Співбесіда з C-level», «Тестове завдання»).
- Column headers and card titles must wrap or truncate with an ellipsis and a tooltip.
  Do not use fixed widths for text.
- Check the board at the minimum window size 800×600 in `uk`: no horizontal overflow in a
  column header or a button.

## Checklist before a PR that touches copy

- [ ] Both locale files changed, and the parity test passes.
- [ ] No string fragments joined in code. No hand-made plurals.
- [ ] Every displayed date and duration goes through `Intl`.
- [ ] The native menu is updated if a menu item changed.
- [ ] The board was checked in `uk` at 800×600.
