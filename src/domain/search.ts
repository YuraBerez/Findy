import type { StageId } from './stages'
import type { Application } from './types'

/** FR-060: case-insensitive match of the title or the company; an empty query matches all. */
export function matchesQuery(application: Application, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase()
  if (!needle) return true
  return (
    application.title.toLocaleLowerCase().includes(needle) ||
    application.company.toLocaleLowerCase().includes(needle)
  )
}

export function filterApplications(applications: Application[], query: string): Application[] {
  return applications.filter((application) => matchesQuery(application, query))
}

/**
 * A drop position counted among the cards a filter shows, as a position in the
 * whole column: the card lands just before the shown card that follows it, so the
 * order of the cards the filter hides does not change.
 */
export function toFullIndex(
  all: Application[],
  shown: Application[],
  id: string,
  target: { stage: StageId; index: number },
): number {
  const column = (list: Application[]) =>
    list
      .filter((application) => application.stage === target.stage && application.id !== id)
      .sort((a, b) => a.order - b.order)
      .map((application) => application.id)
  const next = column(shown)[target.index]
  const full = column(all)
  return next === undefined ? full.length : full.indexOf(next)
}
