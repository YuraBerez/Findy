// Runtime validation of everything that crosses the IPC boundary (docs/security.md)
import { z } from 'zod'
import { ANALYTICS_GROUPINGS, ANALYTICS_PERIODS } from './analytics'
import { CARD_COLORS } from './colors'
import { isHttpUrl, LIMITS } from './limits'
import { STAGES } from './stages'
import { KNOWN_SITE_IDS, SITE_LIMITS, validateSiteForm } from './sites'
import { STALE_DAYS } from './stale'

export { isHttpUrl, LIMITS }

const requiredText = (max: number) => z.string().trim().min(1).max(max)

// Empty or whitespace-only input means "no URL" (FR-010)
export const UrlSchema = z
  .string()
  .trim()
  .max(LIMITS.url)
  .nullish()
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || isHttpUrl(value), { message: 'invalid_url' })

export const IdSchema = z.uuid()
export const StageSchema = z.enum(STAGES)
export const LanguageSchema = z.enum(['en', 'uk'])
/** Spec 007 FR-009: a palette colour, or null for no colour */
export const CardColorSchema = z.enum(CARD_COLORS).nullable()
export const ThemeSchema = z.enum(['system', 'light', 'dark'])
/** Spec 002 FR-006: unique stages, and at least one stays visible */
export const HiddenStagesSchema = z
  .array(StageSchema)
  .refine((stages) => new Set(stages).size === stages.length, { message: 'duplicate_stage' })
  .refine((stages) => new Set(stages).size < STAGES.length, { message: 'all_hidden' })

/** Spec 005 FR-030, FR-031 */
/** Spec 011 FR-010: the same rules as the form (domain/sites/validate.ts) */
export const SiteInputSchema = z
  .object({ name: z.string(), url: z.string() })
  .transform((value, ctx) => {
    const result = validateSiteForm(value)
    if (result.ok) return result.data
    for (const [field, error] of Object.entries(result.errors))
      ctx.addIssue({ code: 'custom', path: [field], message: error.code })
    return z.NEVER
  })

/** Spec 011 FR-015: known site ids, without repeats */
export const HiddenSitesSchema = z
  .array(z.enum(KNOWN_SITE_IDS as [string, ...string[]]))
  .max(KNOWN_SITE_IDS.length)
  .refine((ids) => new Set(ids).size === ids.length, { message: 'duplicate site' })

/** Spec 011 FR-005 */
export const SiteQuerySchema = z.string().trim().max(SITE_LIMITS.query)

/** Spec 010 FR-008: a whole number of days, 3–90 */
export const StaleAfterDaysSchema = z.number().int().min(STALE_DAYS.min).max(STALE_DAYS.max)

export const AnalyticsViewSchema = z.object({
  period: z.enum(ANALYTICS_PERIODS),
  grouping: z.enum(ANALYTICS_GROUPINGS),
})

export const ApplicationInputSchema = z.object({
  title: requiredText(LIMITS.title),
  company: requiredText(LIMITS.company),
  url: UrlSchema.optional().transform((value) => value ?? null),
  stage: StageSchema.optional(),
})

export const ApplicationPatchSchema = z.object({
  title: requiredText(LIMITS.title).optional(),
  company: requiredText(LIMITS.company).optional(),
  url: UrlSchema.optional(),
})

export const MoveTargetSchema = z.object({
  stage: StageSchema,
  index: z.int().min(0),
})

export const NoteTextSchema = requiredText(LIMITS.note)

export type ApplicationInput = z.output<typeof ApplicationInputSchema>
export type ApplicationPatch = z.output<typeof ApplicationPatchSchema>
export type MoveTarget = z.output<typeof MoveTargetSchema>
