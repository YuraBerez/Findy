import { CHROMIUM_EXTENSION_ORIGIN, CONNECTOR_PROTOCOL } from '../../src/shared/extension'
import { expect, test } from '../fixtures/app'

test.describe('Browser extension connector (spec 019)', () => {
  test(
    'US-1.2, US-1.4, FR-011: a vacancy from the browser shows on the open board',
    { tag: '@critical' },
    async ({ findy }) => {
      const { board } = findy.pages
      const connector = await findy.connectBrowser()

      await test.step('FR-011: the app registered the connector for the Findy extension only', async () => {
        const manifest = findy.chromeHostManifest()
        if (manifest)
          expect(manifest).toMatchObject({
            name: 'io.github.findy',
            type: 'stdio',
            path: connector.launcher,
            allowed_origins: [CHROMIUM_EXTENSION_ORIGIN],
          })
      })
      await test.step('FR-010: the connector answers with its protocol', async () => {
        expect(await connector.send({ type: 'hello' })).toMatchObject({
          ok: true,
          protocol: CONNECTOR_PROTOCOL,
        })
      })
      await test.step('US-1.2, US-1.4: the card shows in Applied at once', async () => {
        expect(
          await connector.send({
            type: 'add',
            title: 'Senior QA',
            company: 'Acme',
            url: 'https://djinni.co/jobs/1/',
          }),
        ).toEqual({ ok: true, stage: 'applied' })
        await expect(async () => board.verifyCards('applied', ['Senior QA'])).toPass({
          timeout: 2_500,
        })
      })
    },
  )

  test('US-2, FR-007, FR-008: the same link gives only its stage; bad input changes nothing', async ({
    findy,
  }) => {
    await findy.api.seed([
      { title: 'Frontend', url: 'https://jobs.example/1?utm_source=feed', stage: 'test_task' },
    ])
    const connector = await findy.connectBrowser()

    expect(await connector.send({ type: 'lookup', url: 'https://JOBS.example/1/#apply' })).toEqual({
      ok: true,
      match: { stage: 'test_task' },
    })
    expect(await connector.send({ type: 'lookup', url: 'https://jobs.example/2' })).toEqual({
      ok: true,
      match: null,
    })
    expect(
      await connector.send({ type: 'add', title: '', company: 'Acme', url: 'https://a.com' }),
    ).toMatchObject({ ok: false, error: { code: 'VALIDATION' } })
    expect(await connector.send({ type: 'list' })).toMatchObject({
      ok: false,
      error: { code: 'PROTOCOL' },
    })
    expect((await findy.api.state()).applications.map((item) => item.title)).toEqual(['Frontend'])
  })
})
