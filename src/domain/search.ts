import { sourceName, type SourceChannel } from './fields'
import type { StageId } from './stages'
import type { Application } from './types'

/**
 * FR-060: case-insensitive match of the title or the company; an empty query matches all.
 * Spec 014 FR-040: also the location, the source name and the contact, not amounts.
 * Spec 015 FR-050: also the text of the next step.
 * `channelNames` names the sources that are not a job site, in the language of the user.
 */
export function matchesQuery(
  application: Application,
  query: string,
  channelNames: Record<SourceChannel, string>,
): boolean {
  const needle = query.trim().toLocaleLowerCase()
  if (!needle) return true
  const { source } = application
  return [
    application.title,
    application.company,
    application.location,
    source && sourceName(source, channelNames),
    application.contactName,
    application.contactDetails,
    application.nextStep?.text,
  ].some((text) => text?.toLocaleLowerCase().includes(needle))
}

export function filterApplications(
  applications: Application[],
  query: string,
  channelNames: Record<SourceChannel, string>,
): Application[] {
  return applications.filter((application) => matchesQuery(application, query, channelNames))
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
