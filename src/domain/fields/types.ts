// Spec 014 FR-001: the optional fields of an application and their values.
import type { KnownSiteId } from '../sites'

export const CURRENCIES = ['USD', 'EUR', 'UAH', 'GBP', 'PLN'] as const
export type Currency = (typeof CURRENCIES)[number]

export const SALARY_PERIODS = ['month', 'year'] as const
export type SalaryPeriod = (typeof SALARY_PERIODS)[number]

export const WORK_FORMATS = ['remote', 'office', 'hybrid'] as const
export type WorkFormat = (typeof WORK_FORMATS)[number]

/** Sources that are not a job site, in list order (US-3.1) */
export const SOURCE_CHANNELS = ['referral', 'company_site', 'recruiter', 'other'] as const
export type SourceChannel = (typeof SOURCE_CHANNELS)[number]

/** At least one amount is set; with no amount the application has no salary (FR-003) */
export interface Salary {
  min: number | null
  max: number | null
  currency: Currency
  period: SalaryPeriod
}

export type ApplicationSource =
  | { kind: 'site'; id: KnownSiteId }
  /** FR-005: the name of the user's site when it was chosen, not the site id */
  | { kind: 'custom'; name: string }
  | { kind: 'channel'; id: SourceChannel }

/** The fields of spec 014 on an application; `null` means "not given" */
export interface ApplicationFields {
  salary: Salary | null
  workFormat: WorkFormat | null
  location: string | null
  source: ApplicationSource | null
  contactName: string | null
  contactDetails: string | null
}

export const EMPTY_FIELDS: ApplicationFields = {
  salary: null,
  workFormat: null,
  location: null,
  source: null,
  contactName: null,
  contactDetails: null,
}

const includes = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (list as readonly string[]).includes(value)

export const isCurrency = (value: unknown): value is Currency => includes(CURRENCIES, value)
export const isSalaryPeriod = (value: unknown): value is SalaryPeriod =>
  includes(SALARY_PERIODS, value)
export const isWorkFormat = (value: unknown): value is WorkFormat => includes(WORK_FORMATS, value)
export const isSourceChannel = (value: unknown): value is SourceChannel =>
  includes(SOURCE_CHANNELS, value)
