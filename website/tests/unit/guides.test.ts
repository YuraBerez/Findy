import { describe, expect, it } from 'vitest'
import { PROJECT_URL } from '../../../src/shared/project'
import { rewriteGuideLink } from '../../src/lib/guideLinks'
import { GUIDES, missingGuides, parseGuideId } from '../../src/lib/guides'
import { remarkGuideLinks } from '../../src/lib/remarkGuideLinks'
import type { Root } from 'mdast'

const BASE = '/Findy/'

describe('guide files (spec 020 FR-006)', () => {
  it('reads the slug and the language from the file name', () => {
    expect(parseGuideId('install')).toEqual({ slug: 'install', lang: 'en' })
    expect(parseGuideId('ai-assistant.uk')).toEqual({ slug: 'ai-assistant', lang: 'uk' })
    expect(parseGuideId('install.pl')).toEqual({ slug: 'install', lang: 'pl' })
    expect(parseGuideId('install.de')).toBeNull()
    expect(parseGuideId('other')).toBeNull()
    expect(parseGuideId('install.uk.old')).toBeNull()
  })

  it('finds a guide with no translation', () => {
    const all = GUIDES.flatMap((slug) => [slug, `${slug}.uk`])
    expect(missingGuides(all, ['en', 'uk'])).toEqual([])
    expect(
      missingGuides(
        all.filter((id) => id !== 'install.uk'),
        ['en', 'uk'],
      ),
    ).toEqual(['install.uk'])
  })
})

describe('guide links (spec 020 FR-008)', () => {
  it('opens another guide on the website, in its language', () => {
    expect(rewriteGuideLink('install.uk.md', BASE)).toBe('/Findy/uk/guide/install/')
    expect(rewriteGuideLink('browser-extension.md#install', BASE)).toBe(
      '/Findy/guide/browser-extension/#install',
    )
    expect(rewriteGuideLink('./ai-assistant.md', BASE)).toBe('/Findy/guide/ai-assistant/')
  })

  it('opens another repository file on GitHub', () => {
    expect(rewriteGuideLink('../../README.uk.md', BASE)).toBe(
      `${PROJECT_URL}/blob/main/README.uk.md`,
    )
    expect(rewriteGuideLink('../../skills/findy/SKILL.md#top', BASE)).toBe(
      `${PROJECT_URL}/blob/main/skills/findy/SKILL.md#top`,
    )
    expect(rewriteGuideLink('notes.md', BASE)).toBe(`${PROJECT_URL}/blob/main/docs/guide/notes.md`)
  })

  it('keeps anchors and absolute links', () => {
    expect(rewriteGuideLink('#встановити-скіл-findy', BASE)).toBe('#встановити-скіл-findy')
    expect(rewriteGuideLink('https://example.com/a', BASE)).toBe('https://example.com/a')
    expect(rewriteGuideLink('mailto:a@b.c', BASE)).toBe('mailto:a@b.c')
  })

  it('rewrites the links and the link definitions of a Markdown tree', () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'link', url: 'install.md', children: [] }],
        },
        { type: 'definition', identifier: 'a', label: 'a', url: '../../PRIVACY.md' },
      ],
    }
    remarkGuideLinks({ base: BASE })(tree)
    expect(tree).toMatchObject({
      children: [
        { children: [{ url: '/Findy/guide/install/' }] },
        { url: `${PROJECT_URL}/blob/main/PRIVACY.md` },
      ],
    })
  })
})
