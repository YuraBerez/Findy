// Spec 014: rules of the extra application fields
import { describe, expect, it } from 'vitest'
import {
  EMPTY_FIELDS,
  fieldsFormValuesOf,
  lastCurrency,
  parseAmount,
  parseSourceText,
  patchFields,
  salaryProblem,
  sourceFromUrl,
  sourceKey,
  sourceName,
  sourceOfKey,
  validateFieldsForm,
  type FieldsFormValues,
  type Salary,
} from '../../src/domain/fields'
import type { Application } from '../../src/domain/types'
import {
  ApplicationInputSchema,
  ApplicationPatchSchema,
  SalarySchema,
  SourceSchema,
} from '../../src/domain/schema'

const salary = (min: number | null, max: number | null): Salary => ({
  min,
  max,
  currency: 'USD',
  period: 'month',
})

const CHANNELS_EN = {
  referral: 'Referral',
  company_site: 'Company website',
  recruiter: 'Recruiter contacted me',
  other: 'Other',
}
const CHANNELS_UK = {
  referral: 'Реферал',
  company_site: 'Сайт компанії',
  recruiter: 'Рекрутер написав',
  other: 'Інше',
}

describe('salary (FR-001…FR-003)', () => {
  it('needs one amount, whole numbers 0…1e9, and min ≤ max', () => {
    expect(salaryProblem(salary(3000, 4000))).toBeNull()
    expect(salaryProblem(salary(3000, null))).toBeNull()
    expect(salaryProblem(salary(null, 4000))).toBeNull()
    expect(salaryProblem(salary(0, 0))).toBeNull()
    expect(salaryProblem(salary(null, null))).toBe('invalid')
    expect(salaryProblem(salary(1.5, null))).toBe('invalid')
    expect(salaryProblem(salary(-1, null))).toBe('invalid')
    expect(salaryProblem(salary(null, 1_000_000_001))).toBe('invalid')
    expect(salaryProblem(salary(5000, 4000))).toBe('order')
  })

  it('reads typed amounts with group separators', () => {
    expect(parseAmount('3000')).toBe(3000)
    expect(parseAmount(' 3 000 ')).toBe(3000)
    expect(parseAmount('3,000')).toBe(3000)
    expect(parseAmount('3 000')).toBe(3000)
    expect(parseAmount('')).toBeNull()
    expect(parseAmount('   ')).toBeNull()
    expect(parseAmount('3k')).toBeUndefined()
    expect(parseAmount('-5')).toBeUndefined()
    expect(parseAmount('9'.repeat(11))).toBeUndefined()
  })

  it('the schema applies the same rules', () => {
    expect(SalarySchema.safeParse(salary(3000, 4000)).success).toBe(true)
    expect(SalarySchema.safeParse(salary(5000, 4000)).success).toBe(false)
    expect(SalarySchema.safeParse(salary(null, null)).success).toBe(false)
    expect(SalarySchema.safeParse({ ...salary(1, 2), currency: 'JPY' }).success).toBe(false)
    expect(SalarySchema.safeParse({ ...salary(1, 2), period: 'week' }).success).toBe(false)
  })
})

describe('source from the link (FR-020)', () => {
  const sites = [{ id: 's1', name: 'Acme careers', url: 'https://careers.acme.com/?q={query}' }]

  it('finds known sites by host, subdomains and www', () => {
    expect(sourceFromUrl('https://djinni.co/jobs/123/', [])).toEqual({ kind: 'site', id: 'djinni' })
    expect(sourceFromUrl('https://ua.linkedin.com/jobs/view/1', [])).toEqual({
      kind: 'site',
      id: 'linkedin',
    })
    expect(sourceFromUrl('https://WWW.Work.ua/jobs/1/', [])).toEqual({ kind: 'site', id: 'workua' })
    expect(sourceFromUrl('https://jobs.dou.ua/companies/x/vacancies/1/', [])).toEqual({
      kind: 'site',
      id: 'dou',
    })
  })

  it('then the user sites, by name', () => {
    expect(sourceFromUrl('https://careers.acme.com/jobs/7', sites)).toEqual({
      kind: 'custom',
      name: 'Acme careers',
    })
  })

  it('no match, no link or a bad link → null', () => {
    expect(sourceFromUrl('https://example.com/job', sites)).toBeNull()
    expect(sourceFromUrl('https://notdjinni.co/', [])).toBeNull()
    expect(sourceFromUrl(null, sites)).toBeNull()
    expect(sourceFromUrl('not a link', sites)).toBeNull()
    expect(sourceFromUrl('https://a.com', [{ id: 'x', name: 'Bad', url: 'nope' }])).toBeNull()
  })
})

describe('source as text (FR-042, MCP)', () => {
  const parse = (text: string) => parseSourceText(text, [CHANNELS_EN, CHANNELS_UK])

  it('reads known sites and channels by id or name in both languages', () => {
    expect(parse('Djinni')).toEqual({ kind: 'site', id: 'djinni' })
    expect(parse(' linkedin ')).toEqual({ kind: 'site', id: 'linkedin' })
    expect(parse('LinkedIn Jobs')).toEqual({ kind: 'site', id: 'linkedin' })
    expect(parse('referral')).toEqual({ kind: 'channel', id: 'referral' })
    expect(parse('Company website')).toEqual({ kind: 'channel', id: 'company_site' })
    expect(parse('рекрутер написав')).toEqual({ kind: 'channel', id: 'recruiter' })
  })

  it('anything else is a custom name up to 60 characters', () => {
    expect(parse('Acme careers')).toEqual({ kind: 'custom', name: 'Acme careers' })
    expect(parse('x'.repeat(60))).toEqual({ kind: 'custom', name: 'x'.repeat(60) })
    expect(parse('x'.repeat(61))).toBeUndefined()
    expect(parse('  ')).toBeNull()
  })

  it('names a source in the given language', () => {
    expect(sourceName({ kind: 'site', id: 'workua' }, CHANNELS_EN)).toBe('Work.ua')
    expect(sourceName({ kind: 'custom', name: 'Acme' }, CHANNELS_EN)).toBe('Acme')
    expect(sourceName({ kind: 'channel', id: 'other' }, CHANNELS_UK)).toBe('Інше')
  })

  it('the schema checks kinds, known ids and the name length', () => {
    expect(SourceSchema.safeParse({ kind: 'site', id: 'djinni' }).success).toBe(true)
    expect(SourceSchema.safeParse({ kind: 'site', id: 'monster' }).success).toBe(false)
    expect(SourceSchema.safeParse({ kind: 'custom', name: '  ' }).success).toBe(false)
    expect(SourceSchema.safeParse({ kind: 'channel', id: 'friend' }).success).toBe(false)
  })
})

describe('input and patch (ipc.md)', () => {
  it('a missing field stays missing, null clears, empty text is null', () => {
    const patch = ApplicationPatchSchema.parse({ location: '  ', contactName: ' Olena ' })
    expect(patch).toEqual({ location: null, contactName: 'Olena' })
    expect(patch).not.toHaveProperty('salary')
    expect(ApplicationPatchSchema.parse({ salary: null, source: null })).toEqual({
      salary: null,
      source: null,
    })
  })

  it('rejects too long text and unknown work formats', () => {
    expect(ApplicationPatchSchema.safeParse({ location: 'x'.repeat(101) }).success).toBe(false)
    expect(ApplicationPatchSchema.safeParse({ contactDetails: 'x'.repeat(201) }).success).toBe(
      false,
    )
    expect(
      ApplicationInputSchema.safeParse({ title: 'a', company: 'b', workFormat: 'moon' }).success,
    ).toBe(false)
  })

  it('patchFields applies only the given fields', () => {
    const base = { ...EMPTY_FIELDS, location: 'Kyiv', workFormat: 'office' as const }
    expect(patchFields(base, { location: null, contactName: 'Olena' })).toEqual({
      ...base,
      location: null,
      contactName: 'Olena',
    })
  })
})

describe('details form (FR-010…FR-013)', () => {
  const values = (extra: Partial<FieldsFormValues> = {}): FieldsFormValues => ({
    ...fieldsFormValuesOf(EMPTY_FIELDS, 'EUR'),
    ...extra,
  })

  it('starts empty with the default currency and per month (FR-012)', () => {
    expect(values()).toMatchObject({ salaryMin: '', currency: 'EUR', period: 'month', source: '' })
  })

  it('round-trips saved fields', () => {
    const fields = {
      salary: { min: 3000, max: null, currency: 'UAH' as const, period: 'year' as const },
      workFormat: 'hybrid' as const,
      location: 'Lviv',
      source: { kind: 'custom' as const, name: 'Acme: careers' },
      contactName: 'Olena',
      contactDetails: 'https://t.me/olena',
    }
    const result = validateFieldsForm(fieldsFormValuesOf(fields, 'USD'))
    expect(result).toEqual({ ok: true, data: fields })
  })

  it('no amount → no salary, even with a currency (FR-003)', () => {
    const result = validateFieldsForm(values({ currency: 'GBP', period: 'year' }))
    expect(result).toEqual({ ok: true, data: EMPTY_FIELDS })
  })

  it('shows errors for bad amounts, order and long text', () => {
    expect(validateFieldsForm(values({ salaryMin: '3k', salaryMax: '-1' }))).toEqual({
      ok: false,
      errors: { salaryMin: { code: 'invalidAmount' }, salaryMax: { code: 'invalidAmount' } },
    })
    expect(validateFieldsForm(values({ salaryMin: '5000', salaryMax: '4000' }))).toEqual({
      ok: false,
      errors: { salaryMin: { code: 'salaryOrder' } },
    })
    expect(
      validateFieldsForm(
        values({
          location: 'x'.repeat(101),
          contactName: 'x'.repeat(101),
          contactDetails: 'x'.repeat(201),
        }),
      ),
    ).toEqual({
      ok: false,
      errors: {
        location: { code: 'tooLong', max: 100 },
        contactName: { code: 'tooLong', max: 100 },
        contactDetails: { code: 'tooLong', max: 200 },
      },
    })
  })

  it('source keys', () => {
    for (const source of [
      { kind: 'site', id: 'djinni' },
      { kind: 'channel', id: 'recruiter' },
      { kind: 'custom', name: 'a:b' },
    ] as const)
      expect(sourceOfKey(sourceKey(source))).toEqual(source)
    expect(sourceKey(null)).toBe('')
    expect(sourceOfKey('')).toBeNull()
    expect(sourceOfKey('site:monster')).toBeNull()
    expect(sourceOfKey('channel:friend')).toBeNull()
    expect(sourceOfKey('custom:')).toBeNull()
  })

  it('default currency: the last application with a salary (FR-012)', () => {
    const app = (updatedAt: string, currency: 'UAH' | 'PLN' | null) =>
      ({
        updatedAt,
        salary: currency && { min: 1, max: null, currency, period: 'month' },
      }) as unknown as Application
    expect(lastCurrency([])).toBe('USD')
    expect(
      lastCurrency([app('2026-11-01', 'UAH'), app('2026-11-03', 'PLN'), app('2026-11-05', null)]),
    ).toBe('PLN')
  })
})
