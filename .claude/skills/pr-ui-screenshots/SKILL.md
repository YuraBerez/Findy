---
name: pr-ui-screenshots
description: Capture real screenshots of changed Findy UI with Playwright's Electron driver and attach them to a PR — when a PR needs them, which states and locales to capture, how to seed fake data in an isolated user-data dir, where to host the PNGs (orphan `pr-screenshots` branch), and the PR-body table. Use only when the user asked for screenshots on a PR that changes what a user sees.
---

# /pr-ui-screenshots — show the UI after the change

Screenshots are **optional**. Capture them only when the user asks. Without a request, the
PR's `## UI after changes` section lists the changed screens and states in text.
Screenshots are always real captures of the built app. A mockup is not a substitute.

## 1. Does the PR need it?

Only if the user asked **and** the diff touches one of these:

- `src/renderer/**` (components, styles);
- `locales/*.json`;
- the native menu or dialogs in `src/main/menu.ts` / `src/main/i18n.ts`.

## 2. What to capture

- Every new or changed screen, in every state that the spec's acceptance scenarios name:
  empty board, filled board, dialog open, validation error, confirmation, and so on.
  Use one image for each state.
- Both locales: `en` and `uk`. Ukrainian text is longer, so it shows overflow problems.
- Light and dark theme, if the change touches styles.
- Window size 1280×800. Add 800×600 (the minimum window) if the change touches layout.
- **Fake data only.** Never use the developer's real `findy.db`.

## 3. Capture

Use a temporary `e2e/self-tests/*.test.ts` (delete it afterwards). Its `findy` fixture
already launches the built app with an isolated database; seed with `findy.api`. Launch the built app with
an isolated user-data directory (`FINDY_USER_DATA_DIR`), so that the real database is
never touched. The e2e tests use the same variable.

```ts
import { _electron as electron } from '@playwright/test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const userData = mkdtempSync(join(tmpdir(), 'findy-shots-'))
const app = await electron.launch({
  args: ['.'],
  cwd: '<repo root>',
  // src/main reads FINDY_USER_DATA_DIR and calls app.setPath('userData', …) before ready
  env: { ...process.env, FINDY_USER_DATA_DIR: userData },
})
const page = await app.firstWindow()
await page.setViewportSize({ width: 1280, height: 800 })
// Seed data through the public API (window.findy), never by writing SQL:
await page.evaluate(() => window.findy.createApplication({ title: 'Frontend Developer', company: 'Acme' }))
// Switch locale through the API too:
await page.evaluate(() => window.findy.setLanguage('uk'))
await page.screenshot({ path: '<shots dir>/<feature>-<state>-<locale>.png' })
await app.close()
```

- Run `npm run build` first. The script launches `out/`, not the dev server.
- Dark theme: `await page.emulateMedia({ colorScheme: 'dark' })`.
- Use a new, empty shots directory for each run, so old PNGs do not get into the PR.
- To check a shot, read a small copy (`sips -Z 600 <png> --out <scratchpad>/x.png`), not
  the full-size file.

## 4. Host on the `pr-screenshots` branch

Push the PNGs to the orphan `pr-screenshots` branch, in a folder named after the PR branch.
This branch is never merged.

```bash
SRC=<shots dir>
BR=$(git branch --show-current)
TMP=$(mktemp -d)
if git ls-remote --exit-code --heads origin pr-screenshots >/dev/null; then
  git fetch -q origin pr-screenshots && git worktree add -q --detach "$TMP" origin/pr-screenshots
else
  git worktree add -q --detach "$TMP" && (cd "$TMP" && git checkout -q --orphan "shots-$$" && git rm -rfq .)
fi
git -C "$TMP" rm -rq --ignore-unmatch "$BR"; mkdir -p "$TMP/$BR" && cp "$SRC"/*.png "$TMP/$BR/"
(cd "$TMP" && git add -A "$BR" && git commit -qm "screenshots: $BR" && git push -q origin HEAD:pr-screenshots)
SHA=$(git -C "$TMP" rev-parse HEAD)
git worktree remove "$TMP"
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
```

Image URL: `https://github.com/$REPO/blob/$SHA/$BR/<file>.png?raw=true`. Pin the URL to
`$SHA`, so a later re-capture does not change what an earlier review saw.

## 5. PR body section

```markdown
## UI after changes

Captured from the built app, 1280×800, fake data.

| State | en | uk |
|---|---|---|
| Empty board | <img src="…/board-empty-en.png?raw=true" width="480"> | <img src="…/board-empty-uk.png?raw=true" width="480"> |
```

If a review fix changes the screen, capture the affected states again, repeat step 4, and
update the PR body with the new SHA.

## If you cannot capture or host

Write the exact error in the section, and list the local paths of the files that you
captured. Report it to the user as an open item. Never commit PNGs to the feature branch,
and never fake a screenshot.
