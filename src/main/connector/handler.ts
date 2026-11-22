// Spec 019: the answers of the connector to the browser extension
// (docs/contracts/native-messaging.md). It gives no other data (FR-008).
import { z } from 'zod'
import { sameVacancyLink } from '../../domain/links'
import { ApplicationInputSchema, LIMITS, UrlSchema } from '../../domain/schema'
import type { StageId } from '../../domain/stages'
import { CONNECTOR_PROTOCOL } from '../../shared/extension'
import { HiddenStageError, type Repository } from '../db/repository'

const LinkSchema = UrlSchema.refine((value) => value !== null, { message: 'invalid_url' })
const textOf = (max: number) => z.string().trim().min(1).max(max)

const RequestSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('hello') }),
  z.object({ type: z.literal('lookup'), url: LinkSchema }),
  z.object({
    type: z.literal('add'),
    title: textOf(LIMITS.title),
    company: textOf(LIMITS.company),
    url: LinkSchema,
  }),
])

export type ConnectorErrorCode = 'VALIDATION' | 'STORAGE' | 'PROTOCOL'

export type ConnectorAnswer =
  | { ok: true; protocol: number; version: string }
  | { ok: true; match: { stage: StageId } | null }
  | { ok: true; stage: StageId }
  | { ok: false; error: { code: ConnectorErrorCode; message: string } }

export interface ConnectorDeps {
  /** null when the database cannot be opened */
  repository: Repository | null
  version: string
  storageProblem: string
}

export const connectorError = (code: ConnectorErrorCode, message: string): ConnectorAnswer => ({
  ok: false,
  error: { code, message },
})

/** FR-006: the stage of the last updated application with the same link */
function lookup(repository: Repository, url: string): ConnectorAnswer {
  const matches = repository
    .listApplications()
    .filter((application) => application.url !== null && sameVacancyLink(application.url, url))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0))
  return { ok: true, match: matches[0] ? { stage: matches[0].stage } : null }
}

/** One request → one answer. Never throws. */
export function handleRequest(request: unknown, deps: ConnectorDeps): ConnectorAnswer {
  const parsed = RequestSchema.safeParse(request)
  if (!parsed.success) {
    const type = (request as { type?: unknown } | null)?.type
    return ['hello', 'lookup', 'add'].includes(type as string)
      ? connectorError(
          'VALIDATION',
          parsed.error.issues.map((issue) => issue.path.join('.') || issue.message).join(', '),
        )
      : connectorError('PROTOCOL', 'Unknown request')
  }
  const message = parsed.data
  if (message.type === 'hello')
    return { ok: true, protocol: CONNECTOR_PROTOCOL, version: deps.version }
  const { repository } = deps
  if (!repository) return connectorError('STORAGE', deps.storageProblem)
  try {
    if (message.type === 'lookup') return lookup(repository, message.url as string)
    // FR-004: always "Applied"; the source comes from the link (spec 014 FR-020)
    const created = repository.createApplication(
      ApplicationInputSchema.parse({ ...message, stage: 'applied' }),
    )
    return { ok: true, stage: created.stage }
  } catch (error) {
    if (error instanceof HiddenStageError) return connectorError('VALIDATION', error.message)
    return connectorError('STORAGE', error instanceof Error ? error.message : String(error))
  }
}
