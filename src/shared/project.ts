// The project on GitHub: every link to it is built here, so a rename changes one line

const OWNER = 'YuraBerez'
const NAME = 'Findy'
const REPOSITORY = `${OWNER}/${NAME}`

/** Home page of the project (About dialog, Help menu) */
export const PROJECT_URL = `https://github.com/${REPOSITORY}`

/** Spec 013: where people can support the project */
export const SUPPORT_URL = 'https://ko-fi.com/findyapp'

/** FR-074: the "Found an issue?" button */
export const NEW_ISSUE_URL = `${PROJECT_URL}/issues/new/choose`

/** Spec 006: a release page; "Download" may open only a URL that starts with this */
export const RELEASE_PAGE_PREFIX = `${PROJECT_URL}/releases/tag/`

export const releasePageUrl = (tag: string): string => `${RELEASE_PAGE_PREFIX}${tag}`

/** Spec 020 FR-012: a file of a release, for the download links of the website */
export const releaseFileUrl = (tag: string, name: string): string =>
  `${PROJECT_URL}/releases/download/${tag}/${encodeURIComponent(name)}`

/**
 * A release page of this repository. GitHub names are not case-sensitive and the API
 * gives the current spelling, so 0.5.0 (`YuraBerez/findy`) refused every answer.
 */
export const isReleasePage = (url: string): boolean =>
  url.toLowerCase().startsWith(RELEASE_PAGE_PREFIX.toLowerCase())

/** Spec 006 FR-005: the latest published, stable release (drafts and pre-releases excluded) */
export const LATEST_RELEASE_API_URL = `https://api.github.com/repos/${REPOSITORY}/releases/latest`

/** Spec 016 FR-023: the README section with the steps to install the skill */
export const SKILL_INSTALL_URL = `${PROJECT_URL}#install-the-findy-skill`

/** Spec 017 FR-001: the skill file on the main branch, for the install command */
export const SKILL_RAW_URL = `https://raw.githubusercontent.com/${REPOSITORY}/main/skills/findy/SKILL.md`

/** Spec 019 FR-010: where the browser extension sends a user who has no Findy */
export const DOWNLOAD_URL = `${PROJECT_URL}/releases/latest`

/** Spec 020 FR-008: a file of the repository on the main branch (append its path) */
export const SOURCE_URL = `${PROJECT_URL}/blob/main/`

/**
 * Spec 020 FR-030: the project website on GitHub Pages. The host is the owner in lower
 * case; the path keeps the repository case, because Pages paths are case-sensitive.
 */
export const SITE_URL = `https://${OWNER.toLowerCase()}.github.io/${NAME}/`

/** Spec 012: the Homebrew tap (the repository `homebrew-findy`) and the Scoop bucket */
export const HOMEBREW_TAP = `${OWNER.toLowerCase()}/findy`
export const SCOOP_BUCKET_URL = `https://github.com/${OWNER}/scoop-findy`
