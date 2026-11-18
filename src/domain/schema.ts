// Runtime validation of everything that crosses the IPC boundary (docs/security.md)
import { z } from 'zod'
import { ANALYTICS_GROUPINGS, ANALYTICS_PERIODS } from './analytics'
import { CARD_COLORS } from './colors'
import { isHttpUrl, LIMITS } from './limits'
import { STAGES } from './stages'

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
