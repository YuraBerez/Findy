// Spec 019: what the popup shows, as pure data, so the rules are unit-tested.
import type { StageId } from '@domain/stages'
import { addVacancy, helloFindy, lookupLink, type Send } from '../native'
import { readOpenPage, type PageApi } from '../page'

export interface Form {
  title: string
  company: string
  url: string
}

export type PopupState =
  | { kind: 'loading' }
  /** US-3.3: not an http(s) page */
  | { kind: 'unsupported' }
  /** US-3.1, FR-010 */
  | { kind: 'noFindy' }
  | {
      kind: 'ready'
      form: Form
      /** FR-006: the stage of an application with the same link */
      match: StageId | null
      saving: boolean
      /** US-3.4: the reason of a failed add */
      error: string | null
    }
  | { kind: 'added' }

/** Reads the page and asks Findy, in parallel (NFR-004) */
export async function loadPopup(send: Send, page?: PageApi): Promise<PopupState> {
  const [open, found] = await Promise.all([readOpenPage(page), helloFindy(send)])
  if (!open) return { kind: 'unsupported' }
  if (!found) return { kind: 'noFindy' }
  return {
    kind: 'ready',
    form: { title: open.vacancy.title ?? '', company: open.vacancy.company ?? '', url: open.url },
    match: await lookupLink(send, open.url),
    saving: false,
    error: null,
  }
}

/** FR-005: both fields filled, and no add in progress (one click adds once) */
export const canAdd = (state: PopupState): boolean =>
  state.kind === 'ready' &&
  !state.saving &&
  state.form.title.trim() !== '' &&
  state.form.company.trim() !== ''

/** FR-004: the state after "Add to Findy" or "Add anyway" */
export async function submit(
  send: Send,
  state: Extract<PopupState, { kind: 'ready' }>,
): Promise<PopupState> {
  const error = await addVacancy(send, {
    title: state.form.title.trim(),
    company: state.form.company.trim(),
    url: state.form.url,
  })
  return error === null ? { kind: 'added' } : { ...state, saving: false, error }
}
