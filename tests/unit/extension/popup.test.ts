import { describe, expect, it } from 'vitest'
import {
  addVacancy,
  helloFindy,
  lookupLink,
  type Send,
} from '../../../src/extension/browser/connector'
import { MAX_PAGE_CHARS, readOpenPage, type PageApi } from '../../../src/extension/browser/page'
import { canAdd, loadPopup, submit, type PopupState } from '../../../src/extension/popup/state'
import { CONNECTOR_PROTOCOL } from '../../../src/shared/extension'

const VACANCY = `<html><head><script type="application/ld+json">
{"@type":"JobPosting","title":"Senior QA","hiringOrganization":{"name":"Acme"}}
</script></head><body></body></html>`

const page = (url: string | undefined, html: string | (() => never) = VACANCY): PageApi => ({
  activeTab: async () => ({ id: 7, url }),
  html: async () => (typeof html === 'function' ? html() : html),
})

/** A fake connector: answers by request type and records the requests */
function connector(answers: Record<string, unknown>): Send & { sent: object[] } {
  const sent: object[] = []
  const send = (async (message: { type: string }) => {
    sent.push(message)
    const answer = answers[message.type]
    if (answer instanceof Error) throw answer
    return answer
  }) as Send & { sent: object[] }
  send.sent = sent
  return send
}

const findy = (extra: Record<string, unknown> = {}) =>
  connector({
    hello: { ok: true, protocol: CONNECTOR_PROTOCOL, version: '0.7.0' },
    lookup: { ok: true, match: null },
    add: { ok: true, stage: 'applied' },
    ...extra,
  })

describe('open page (spec 019 FR-001, FR-002)', () => {
  it('finds the job title and the company of the active tab', async () => {
    expect(await readOpenPage(page('https://jobs.example/1'))).toEqual({
      url: 'https://jobs.example/1',
      vacancy: { title: 'Senior QA', company: 'Acme' },
    })
  })

  it('gives null for a page that is not http(s), and empty values for a protected page', async () => {
    expect(await readOpenPage(page('chrome://newtab/'))).toBeNull()
    expect(await readOpenPage(page(undefined))).toBeNull()
    const protectedPage = page('https://store.example/', () => {
      throw new Error('Cannot access contents of the page')
    })
    expect((await readOpenPage(protectedPage))?.vacancy).toEqual({ title: null, company: null })
  })

  it('reads at most 2 MB of the page', async () => {
    let seen = 0
    const big: PageApi = {
      activeTab: async () => ({ id: 1, url: 'https://a.com' }),
      html: async () => {
        const html = `<h2>x</h2>${'x'.repeat(MAX_PAGE_CHARS)}<h1>Late</h1>`
        seen = html.length
        return html
      },
    }
    const open = await readOpenPage(big)
    expect(seen).toBeGreaterThan(MAX_PAGE_CHARS)
    expect(open?.vacancy.title).toBeNull()
  })
})

describe('connector client (spec 019 FR-006, FR-010)', () => {
  it('accepts only Findy with the same protocol', async () => {
    expect(await helloFindy(findy())).toBe(true)
    expect(await helloFindy(findy({ hello: { ok: true, protocol: 2 } }))).toBe(false)
    expect(await helloFindy(findy({ hello: 'nonsense' }))).toBe(false)
    expect(
      await helloFindy(findy({ hello: new Error('Specified native messaging host not found.') })),
    ).toBe(false)
  })

  it('gives the stage of a match, else null', async () => {
    expect(
      await lookupLink(
        findy({ lookup: { ok: true, match: { stage: 'offered' } } }),
        'https://a.com',
      ),
    ).toBe('offered')
    expect(
      await lookupLink(
        findy({ lookup: { ok: false, error: { code: 'STORAGE', message: 'x' } } }),
        'https://a.com',
      ),
    ).toBeNull()
    expect(await lookupLink(findy({ lookup: new Error('gone') }), 'https://a.com')).toBeNull()
  })

  it('gives the reason of a failed add', async () => {
    const vacancy = { title: 'QA', company: 'Acme', url: 'https://a.com' }
    expect(await addVacancy(findy(), vacancy)).toBeNull()
    expect(
      await addVacancy(
        findy({ add: { ok: false, error: { code: 'STORAGE', message: 'locked' } } }),
        vacancy,
      ),
    ).toBe('locked')
    expect(await addVacancy(findy({ add: 42 }), vacancy)).toMatch(/unknown answer/)
    expect(await addVacancy(findy({ add: new Error('Findy did not answer') }), vacancy)).toBe(
      'Findy did not answer',
    )
  })
})

describe('popup state (spec 019 US-1…US-3)', () => {
  it('shows the values and no match for a new vacancy (US-1.1)', async () => {
    const state = await loadPopup(findy(), page('https://jobs.example/1'))
    expect(state).toEqual({
      kind: 'ready',
      form: { title: 'Senior QA', company: 'Acme', url: 'https://jobs.example/1' },
      match: null,
      saving: false,
      error: null,
    })
    expect(canAdd(state)).toBe(true)
  })

  it('shows the stage of the same vacancy (US-2.1)', async () => {
    const state = await loadPopup(
      findy({ lookup: { ok: true, match: { stage: 'technical_interview' } } }),
      page('https://jobs.example/1'),
    )
    expect(state).toMatchObject({ kind: 'ready', match: 'technical_interview' })
  })

  it('explains a missing Findy and a page that is not http(s) (US-3.1, US-3.3)', async () => {
    expect(await loadPopup(findy({ hello: new Error('no host') }), page('https://a.com'))).toEqual({
      kind: 'noFindy',
    })
    expect(await loadPopup(findy(), page('about:blank'))).toEqual({ kind: 'unsupported' })
  })

  it('allows the add only with both fields and not while saving (FR-005, US-3.2)', () => {
    const ready: PopupState = {
      kind: 'ready',
      form: { title: 'QA', company: ' ', url: 'https://a.com' },
      match: null,
      saving: false,
      error: null,
    }
    expect(canAdd(ready)).toBe(false)
    expect(canAdd({ ...ready, form: { ...ready.form, company: 'Acme' } })).toBe(true)
    expect(canAdd({ ...ready, form: { ...ready.form, company: 'Acme' }, saving: true })).toBe(false)
    expect(canAdd({ kind: 'loading' })).toBe(false)
  })

  it('adds the trimmed values, and keeps them with the reason when the add fails (FR-004, US-3.4)', async () => {
    const ready = {
      kind: 'ready' as const,
      form: { title: ' QA ', company: 'Acme ', url: 'https://a.com/1' },
      match: null,
      saving: true,
      error: null,
    }
    const send = findy()
    expect(await submit(send, ready)).toEqual({ kind: 'added' })
    expect(send.sent).toEqual([
      { type: 'add', title: 'QA', company: 'Acme', url: 'https://a.com/1' },
    ])
    const failed = await submit(
      findy({ add: { ok: false, error: { code: 'VALIDATION', message: 'hidden' } } }),
      ready,
    )
    expect(failed).toEqual({ ...ready, saving: false, error: 'hidden' })
  })
})
