import { describe, expect, it } from 'vitest'
import { PROJECT_URL, SITE_URL, SOURCE_URL, releaseFileUrl } from '../../src/shared/project'

describe('project URLs for the website (spec 020)', () => {
  it('gives the GitHub Pages address of the repository (FR-030)', () => {
    const [, owner = '', name = ''] = new URL(PROJECT_URL).pathname.split('/')
    expect(SITE_URL).toBe(`https://${owner.toLowerCase()}.github.io/${name}/`)
  })

  it('links a repository file on the main branch (FR-008)', () => {
    expect(`${SOURCE_URL}README.md`).toBe(`${PROJECT_URL}/blob/main/README.md`)
  })

  it('links a release file and encodes its name (FR-012)', () => {
    expect(releaseFileUrl('v1.2.3', 'Findy-Setup-1.2.3.exe')).toBe(
      `${PROJECT_URL}/releases/download/v1.2.3/Findy-Setup-1.2.3.exe`,
    )
    expect(releaseFileUrl('v1', 'a b#.zip')).toBe(
      `${PROJECT_URL}/releases/download/v1/a%20b%23.zip`,
    )
  })
})
