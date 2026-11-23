import { describe, expect, it } from 'vitest'
import { PROJECT_URL } from '../../../src/shared/project'
import { parseRelease } from '../../src/lib/release'
import { softwareApplication } from '../../src/lib/structuredData'

describe('schema.org data of the home page (spec 020 FR-040)', () => {
  it('describes a free app with its version and download page', () => {
    const release = parseRelease({
      tag_name: 'v1.2.3',
      assets: [{ name: 'Findy-Setup-1.2.3.exe', size: 1 }],
    })
    const data = softwareApplication({
      url: 'https://example.test/',
      lang: 'uk',
      description: 'Трекер',
      category: 'Трекер пошуку роботи',
      image: 'https://example.test/board.png',
      release,
    })
    expect(data).toMatchObject({
      '@type': 'SoftwareApplication',
      name: 'Findy',
      inLanguage: 'uk',
      softwareVersion: '1.2.3',
      downloadUrl: `${PROJECT_URL}/releases/tag/v1.2.3`,
      isAccessibleForFree: true,
      offers: { price: '0' },
      sameAs: [PROJECT_URL],
    })
  })
})
