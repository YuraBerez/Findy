import { expect, test } from '../fixtures/app'

const UKRAINE = ['Djinni', 'DOU', 'Work.ua', 'robota.ua']

test.describe('job sites (spec 011)', () => {
  test.beforeEach(async ({ findy }) => {
    await findy.api.captureExternalLinks()
    await findy.pages.analytics.openTab(/^(Sites|Сайти)$/)
  })

  test(
    'US-1: the known sites; a click opens the search for the query; the query is kept',
    { tag: '@critical' },
    async ({ findy }) => {
      const { sites } = findy.pages
      await test.step('1.1: four groups, then My sites', async () => {
        await sites.verifyGroups(['Ukraine', 'International', 'Remote', 'Europe', 'My sites'])
        await sites.verifyTiles('Ukraine', UKRAINE)
        await sites.verifyTiles('Remote', ['Wellfound', 'Remote OK', 'We Work Remotely'])
      })
      await test.step('1.3: an empty query opens the jobs page', async () => {
        await sites.openSite('Djinni')
        expect(await findy.api.openedLinks()).toEqual(['https://djinni.co/jobs/'])
      })
      await test.step('1.2, 1.5: the query, encoded', async () => {
        await sites.setQuery('QA & Тест')
        await sites.openSite('DOU')
        await sites.openSite('Wellfound') // no search address: the jobs page
        expect((await findy.api.openedLinks()).slice(1)).toEqual([
          'https://jobs.dou.ua/vacancies/?search=QA%20%26%20%D0%A2%D0%B5%D1%81%D1%82',
          'https://wellfound.com/jobs',
        ])
      })
      await test.step('1.4: the query stays after a restart', async () => {
        const pages = await findy.restart()
        await pages.analytics.openTab('Sites')
        await pages.sites.verifyQuery('QA & Тест')
      })
      await test.step('FR-005: a query typed just before a tab change is kept', async () => {
        const { analytics, sites } = findy.pages
        await sites.typeQuery('QA Lead')
        await analytics.pressShortcut(1)
        await analytics.pressShortcut(3)
        await sites.verifyQuery('QA Lead')
      })
      await test.step('FR-005: a query typed just before a restart is kept', async () => {
        await findy.pages.sites.typeQuery('QA Manager')
        const pages = await findy.restart()
        await pages.analytics.openTab('Sites')
        await pages.sites.verifyQuery('QA Manager')
      })
    },
  )

  test('US-2: add, edit and delete a site of my own', async ({ findy }) => {
    const { sites } = findy.pages
    await test.step('2.3: invalid values are refused', async () => {
      await sites.startAdding()
      await sites.fillSite({ name: ' ', url: 'ftp://acme.com' })
      await sites.saveSite()
      await sites.verifySiteError('name', 'Fill in this field.')
      await sites.verifySiteError('url', 'Enter a link that starts with http:// or https://.')
      await sites.fillSite({ name: 'Acme careers', url: 'https://{query}.acme.com/' })
      await sites.saveSite()
      await sites.verifySiteError('url', 'Put {query} once')
    })
    await test.step('2.1: a site with {query} opens with the query', async () => {
      await sites.fillSite({ url: 'https://acme.com/careers?q={query}' })
      await sites.saveSite()
      await sites.verifyDialogClosed()
      await sites.verifyTiles('My sites', ['Acme careers'])
      await sites.setQuery('QA Engineer')
      await sites.openSite('Acme careers')
      expect(await findy.api.openedLinks()).toEqual(['https://acme.com/careers?q=QA%20Engineer'])
    })
    await test.step('2.4, 2.2: edit; an address without {query} opens as is', async () => {
      await sites.startEditing('Acme careers')
      await sites.fillSite({ name: 'Acme', url: 'https://jobs.acme.com/' })
      await sites.saveSite()
      await sites.verifyTiles('My sites', ['Acme'])
      await sites.openSite('Acme')
      expect((await findy.api.openedLinks()).at(-1)).toBe('https://jobs.acme.com/')
    })
    await test.step('2.5: delete asks first', async () => {
      await sites.delete('Acme', false)
      await sites.verifyTiles('My sites', ['Acme'])
      await sites.delete('Acme', true)
      await sites.verifyNoTile('Acme')
    })
  })

  test('US-3: hide a known site, keep it hidden, show it again', async ({ findy }) => {
    const { sites } = findy.pages
    await sites.verifyHiddenToggle(null)
    await sites.hide('LinkedIn Jobs')
    await sites.verifyTiles('International', ['Indeed', 'Glassdoor'])
    await sites.verifyHiddenToggle(1)
    const pages = await findy.restart()
    await pages.analytics.openTab('Sites')
    await pages.sites.verifyNoTile('LinkedIn Jobs')
    await pages.sites.showHidden('LinkedIn Jobs')
    await pages.sites.verifyTiles('International', ['LinkedIn Jobs', 'Indeed', 'Glassdoor'])
    await pages.sites.verifyHiddenToggle(null)
  })

  test.describe('icons', () => {
    test.use({ siteIcons: { hosts: ['djinni.co', 'acme.com'] } })

    test('US-4: icons are downloaded once and kept; the letter shows without one', async ({
      findy,
      iconServer,
    }) => {
      const { sites } = findy.pages
      await test.step('4.1, 4.3: a known site gets its icon; others show the letter', async () => {
        await sites.verifyIcon('Djinni', true)
        await sites.verifyIcon('DOU', false)
      })
      await test.step('4.2: a site of my own gets its icon when added', async () => {
        await sites.startAdding()
        await sites.fillSite({ name: 'Acme', url: 'https://acme.com/jobs' })
        await sites.saveSite()
        await sites.verifyIcon('Acme', true)
      })
      await test.step('SC-002: after a restart the icons come from the database', async () => {
        const asked = iconServer!.requests.filter((path) => path.endsWith('icon.png')).length
        const pages = await findy.restart()
        await pages.analytics.openTab('Sites')
        await pages.sites.verifyIcon('Djinni', true)
        await pages.sites.verifyIcon('Acme', true)
        expect(iconServer!.requests.filter((path) => path.endsWith('icon.png'))).toHaveLength(asked)
      })
    })
  })

  test('US-5.1, FR-001: Ctrl/Cmd+3 and the keyboard', async ({ findy }) => {
    const { analytics, sites } = findy.pages
    await analytics.openTab('Board')
    await analytics.pressShortcut(3)
    await analytics.verifySelectedTab('Sites')
    await sites.openFirstSiteWithKeyboard('Djinni')
    expect(await findy.api.openedLinks()).toEqual(['https://djinni.co/jobs/'])
  })

  test('the Sites tab has no accessibility violations', { tag: '@a11y' }, async ({ findy }) => {
    await findy.pages.sites.hide('XING')
    await findy.pages.a11y.expectNoViolations()
  })

  test.describe('in Ukrainian', () => {
    test.use({ systemLocale: 'uk-UA' })

    test('US-5.2: groups in Ukrainian, names as they are; fits 800 × 600', async ({ findy }) => {
      await findy.pages.sites.verifyGroups([
        'Україна',
        'Міжнародні',
        'Віддалена робота',
        'Європа',
        'Мої сайти',
      ])
      await findy.pages.sites.verifyTiles('Україна', UKRAINE)
      await findy.api.setWindowSize(800, 600)
      expect(await findy.api.hasHorizontalScroll()).toBe(false)
    })
  })
})
