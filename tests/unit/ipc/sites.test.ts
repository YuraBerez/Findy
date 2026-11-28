import { describe, expect, it, vi } from 'vitest'
import { unwrap } from '../../../src/shared/ipc'
import { setup, state } from '../helpers/ipc'

describe('job sites (spec 011)', () => {
  const acme = { name: ' Acme careers ', url: ' https://acme.com/careers?q={query} ' }

  it('adds, updates and deletes the user sites; a new host gets its icon (FR-010, FR-011, FR-021)', async () => {
    const ctx = setup()
    let s = await state(ctx.handlers.addSite(acme))
    expect(s.sites).toEqual([
      { id: expect.any(String), name: 'Acme careers', url: 'https://acme.com/careers?q={query}' },
    ])
    expect(ctx.deps.siteIcons!.refresh).toHaveBeenLastCalledWith(['acme.com'])
    const id = s.sites[0]!.id
    s = await state(ctx.handlers.updateSite(id, { name: 'Acme', url: 'https://jobs.acme.org/' }))
    expect(s.sites[0]).toMatchObject({ name: 'Acme', url: 'https://jobs.acme.org/' })
    expect(ctx.deps.siteIcons!.refresh).toHaveBeenLastCalledWith(['jobs.acme.org'])
    s = await state(ctx.handlers.deleteSite(id))
    expect(s.sites).toEqual([])
  })

  it.each([
    [{ name: '', url: 'https://a.com' }],
    [{ name: 'A', url: 'ftp://a.com' }],
    [{ name: 'A', url: 'https://{query}.a.com/' }],
    [{ name: 'A' }],
    ['https://a.com'],
  ])('rejects the site %j with VALIDATION', async (site) => {
    const ctx = setup()
    expect(await ctx.handlers.addSite(site)).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION' },
    })
  })

  it('VALIDATION after 50 sites, NOT_FOUND for an unknown site (FR-011, FR-013)', async () => {
    const ctx = setup()
    for (let i = 0; i < 50; i++)
      await state(ctx.handlers.addSite({ name: `S${i}`, url: 'https://a.com' }))
    expect(await ctx.handlers.addSite(acme)).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION' },
    })
    const unknown = '00000000-0000-4000-8000-000000000000'
    expect(await ctx.handlers.deleteSite(unknown)).toMatchObject({
      ok: false,
      error: { code: 'NOT_FOUND' },
    })
    expect(await ctx.handlers.updateSite(unknown, acme)).toMatchObject({
      ok: false,
      error: { code: 'NOT_FOUND' },
    })
  })

  it('saves hidden known sites and the trimmed query (FR-005, FR-015)', async () => {
    const ctx = setup()
    expect((await state(ctx.handlers.setHiddenSites(['linkedin']))).settings.hiddenSites).toEqual([
      'linkedin',
    ])
    expect((await state(ctx.handlers.setSiteQuery('  QA Engineer '))).settings.siteQuery).toBe(
      'QA Engineer',
    )
    for (const bad of [['myspace'], ['xing', 'xing'], 'xing'])
      expect(await ctx.handlers.setHiddenSites(bad)).toMatchObject({ ok: false })
    expect(await ctx.handlers.setSiteQuery('x'.repeat(201))).toMatchObject({ ok: false })
  })

  it('gives the saved icons and refreshes every site host in the background (FR-021)', async () => {
    const ctx = setup()
    await state(ctx.handlers.addSite({ name: 'Acme', url: 'https://www.acme.com/' }))
    expect(unwrap(await ctx.handlers.getSiteIcons())).toEqual({
      'djinni.co': 'data:image/png;base64,AA==',
    })
    expect(await ctx.handlers.refreshSiteIcons()).toEqual({ ok: true, data: undefined })
    const hosts = vi.mocked(ctx.deps.siteIcons!.refresh).mock.lastCall![0]
    expect(hosts).toContain('djinni.co')
    expect(hosts).toContain('work.ua')
    expect(hosts).toContain('acme.com')
    expect(hosts).toHaveLength(15)
  })

  it('works without icons when the database could not be opened', async () => {
    const ctx = setup({ siteIcons: null })
    expect(unwrap(await ctx.handlers.getSiteIcons())).toEqual({})
    expect(await ctx.handlers.refreshSiteIcons()).toEqual({ ok: true, data: undefined })
  })
})
