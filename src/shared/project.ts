// The project on GitHub: every link to it is built here, so a rename changes one line

const REPOSITORY = 'YuraBerez/Findy'

/** Home page of the project (About dialog, Help menu) */
export const PROJECT_URL = `https://github.com/${REPOSITORY}`

/** Spec 013: where people can support the project */
export const SUPPORT_URL = 'https://ko-fi.com/findyapp'

/** FR-074: the "Found an issue?" button */
export const NEW_ISSUE_URL = `${PROJECT_URL}/issues/new/choose`

/** Spec 006: a release page; "Download" may open only a URL that starts with this */
export const RELEASE_PAGE_PREFIX = `${PROJECT_URL}/releases/tag/`

export const releasePageUrl = (tag: string): string => `${RELEASE_PAGE_PREFIX}${tag}`

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
