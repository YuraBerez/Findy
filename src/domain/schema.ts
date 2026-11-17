// Runtime validation of everything that crosses the IPC boundary (docs/security.md)
import { z } from 'zod'
import { STAGES } from './stages'

export const LIMITS = {
  title: 200,
  company: 200,
  url: 2048,
  note: 10_000,
} as const

const requiredText = (max: number) => z.string().trim().min(1).max(max)

export function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

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
export const ThemeSchema = z.enum(['system', 'light', 'dark'])

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
