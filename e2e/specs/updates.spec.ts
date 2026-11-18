import { expect, test } from '../fixtures/app'

const NETWORK_ERROR = 'Could not check for updates. Check the internet connection and try again.'

test.describe('update check (spec 006)', () => {
  test.describe('a newer release', () => {
    test.use({ latestRelease: { tag: 'v9.0.0' } })

    test(
      'US-1.1, US-1.4: a manual check shows the version; Download opens the release page',
      { tag: '@critical' },
      async ({ findy }) => {
        const { updates } = findy.pages
        await findy.api.captureExternalLinks()
        await updates.checkNow()
        await updates.verifyAvailable('9.0.0')
        await updates.download()
        await updates.verifyNoDialog()
        expect(await findy.api.openedLinks()).toEqual([findy.releases!.pageOf('v9.0.0')])
      },
    )

    test('US-2: off by default; on, it checks at start once per 24 hours', async ({ findy }) => {
      await test.step('2.1, SC-001: no request while it is off', async () => {
        await findy.pages.updates.verifyAutoCheck(false)
        await findy.restart()
        expect(findy.releases!.requests()).toBe(0)
      })
      await test.step('2.2, 2.4: on, the next start checks and shows the popup', async () => {
        await findy.pages.updates.setAutoCheck(true)
        const { updates } = await findy.restart()
        await updates.verifyAvailable('9.0.0')
        expect(findy.releases!.requests()).toBe(1)
      })
      await test.step('2.5: "Later" closes it; Escape works the same', async () => {
        await findy.pages.updates.later()
        await findy.pages.updates.verifyNoDialog()
      })
      await test.step('2.3: no second check within 24 hours', async () => {
        const { updates } = await findy.restart()
        await updates.verifyAutoCheck(true)
        await updates.verifyNoDialog()
        expect(findy.releases!.requests()).toBe(1)
      })
      await test.step('2.7: off again, a manual check still works', async () => {
        await findy.pages.updates.setAutoCheck(false)
        await findy.pages.updates.checkNow()
        await findy.pages.updates.verifyAvailable('9.0.0')
        await findy.pages.updates.closeWithEscape()
        await findy.pages.updates.verifyNoDialog()
        expect(findy.releases!.requests()).toBe(2)
      })
    })

    test('the update dialog has no violations', { tag: '@a11y' }, async ({ findy }) => {
      await findy.pages.updates.checkNow()
      await findy.pages.updates.verifyAvailable('9.0.0')
      await findy.pages.a11y.expectNoViolations()
    })
  })

  test.describe('the same release', () => {
    test.use({ latestRelease: { tag: 'v0.0.1' } })

    test('US-1.2: "You have the latest version"', async ({ findy }) => {
      await findy.pages.updates.checkNow()
      await findy.pages.updates.verifyLatest()
    })
  })

  test.describe('a failing server', () => {
    test.use({ latestRelease: { tag: 'v9.0.0', status: 500 } })

    test('US-1.3: a manual check shows an error; the app works', async ({ findy }) => {
      await findy.pages.updates.checkNow()
      await findy.pages.board.verifyNotification(NETWORK_ERROR)
      await findy.pages.updates.verifyNoDialog()
      await findy.pages.board.verifyShown()
    })

    test('US-2.6: an automatic check fails without a message', async ({ findy }) => {
      await findy.pages.updates.setAutoCheck(true)
      const { board, updates } = await findy.restart()
      await expect.poll(() => findy.releases!.requests()).toBe(1)
      await updates.verifyNoDialog()
      await board.verifyNoNotification()
    })
  })
})
