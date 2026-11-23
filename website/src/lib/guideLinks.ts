import { SOURCE_URL } from '../../../src/shared/project'
import { parseGuideId } from './guides'
import { guidePage, pagePath, withBase } from './paths'

/** The folder of the guides in the repository */
const GUIDE_DIR = 'docs/guide/'
/** A base to resolve relative paths of the repository; it never leaves this module */
const REPO = 'https://repo.invalid/'

/**
 * Spec 020 FR-008: a link in a guide, for the website. A link to another guide opens its
 * page on the website, in the language of that guide. A link to another repository file
 * opens it on GitHub. Anchors and absolute links do not change.
 */
export function rewriteGuideLink(href: string, base: string): string {
  if (href.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(href)) return href
  const target = new URL(href, `${REPO}${GUIDE_DIR}`)
  const path = decodeURIComponent(target.pathname.slice(1))
  const file = path.startsWith(GUIDE_DIR) ? path.slice(GUIDE_DIR.length) : null
  const guide = file?.endsWith('.md') ? parseGuideId(file.slice(0, -3)) : null
  if (guide) return withBase(base, pagePath(guide.lang, guidePage(guide.slug))) + target.hash
  return `${SOURCE_URL}${path}${target.search}${target.hash}`
}
