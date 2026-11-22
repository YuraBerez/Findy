// Spec 019: the requests to the Findy connector (docs/contracts/native-messaging.md)
import type { StageId } from '@domain/stages'
import { CONNECTOR_PROTOCOL, EXTENSION_HOST } from '@shared/extension'

export type ConnectorAnswer =
  | {
      ok: true
      protocol?: number
      version?: string
      match?: { stage: StageId } | null
      stage?: StageId
    }
  | { ok: false; error: { code: string; message: string } }

export type Send = (message: object) => Promise<unknown>

/** The browser's native messaging, with a time limit so the popup never waits forever */
export function nativeSend(timeoutMs = 5000): Send {
  return (message) =>
    Promise.race([
      chrome.runtime.sendNativeMessage(EXTENSION_HOST, message),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Findy did not answer')), timeoutMs),
      ),
    ])
}

const isAnswer = (value: unknown): value is ConnectorAnswer =>
  typeof value === 'object' && value !== null && typeof (value as { ok?: unknown }).ok === 'boolean'

/** FR-010: true when Findy is installed and speaks this protocol */
export async function helloFindy(send: Send): Promise<boolean> {
  try {
    const answer = await send({ type: 'hello' })
    return isAnswer(answer) && answer.ok && answer.protocol === CONNECTOR_PROTOCOL
  } catch {
    return false
  }
}

/** FR-006: the stage of an application with the same link, or null */
export async function lookupLink(send: Send, url: string): Promise<StageId | null> {
  try {
    const answer = await send({ type: 'lookup', url })
    return isAnswer(answer) && answer.ok ? (answer.match?.stage ?? null) : null
  } catch {
    return null
  }
}

/** FR-004: `null` when added, else the reason to show (US-3.4) */
export async function addVacancy(
  send: Send,
  vacancy: { title: string; company: string; url: string },
): Promise<string | null> {
  try {
    const answer = await send({ type: 'add', ...vacancy })
    if (!isAnswer(answer)) return 'Findy gave an unknown answer'
    return answer.ok ? null : answer.error.message
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}
