import { PROJECT_URL, SOURCE_URL } from '../../../src/shared/project'
import type { Release } from './release'

/** The vocabulary of the data; search engines read it (Google, Bing) */
const SCHEMA = 'https://schema.org'

export interface AppFacts {
  url: string
  lang: string
  description: string
  category: string
  image: string
  release: Release
}

/**
 * Spec 020 FR-040: schema.org data of the home page. It tells search engines that Findy
 * is a free desktop app, for which systems, and where to download it.
 */
export const softwareApplication = ({
  url,
  lang,
  description,
  category,
  image,
  release,
}: AppFacts) => ({
  '@context': SCHEMA,
  '@type': 'SoftwareApplication',
  name: 'Findy',
  description,
  url,
  inLanguage: lang,
  image,
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: category,
  operatingSystem: 'Windows 10, Windows 11, macOS 13, Linux',
  softwareVersion: release.version,
  downloadUrl: release.pageUrl,
  license: `${SOURCE_URL}LICENSE`,
  sameAs: [PROJECT_URL],
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
})
