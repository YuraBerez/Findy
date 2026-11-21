import { EMPTY_FIELDS, type ApplicationFields } from './types'

const KEYS = Object.keys(EMPTY_FIELDS) as (keyof ApplicationFields)[]

/** The fields after a patch: `null` clears a field, a missing one stays (ipc.md) */
export function patchFields(
  base: ApplicationFields,
  patch: { [K in keyof ApplicationFields]?: ApplicationFields[K] | undefined },
): ApplicationFields {
  const next = { ...base }
  for (const key of KEYS) {
    const value = patch[key]
    if (value !== undefined) (next as Record<string, unknown>)[key] = value
  }
  return next
}
