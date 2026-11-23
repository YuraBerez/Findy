import type { Link, Definition, Root } from 'mdast'
import { visit } from 'unist-util-visit'
import { rewriteGuideLink } from './guideLinks'

/** Spec 020 FR-008: rewrites the links of a guide while Astro renders it */
export function remarkGuideLinks({ base }: { base: string }) {
  return (tree: Root) => {
    visit(tree, ['link', 'definition'], (node) => {
      const link = node as Link | Definition
      link.url = rewriteGuideLink(link.url, base)
    })
  }
}
