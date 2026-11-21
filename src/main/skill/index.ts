// Spec 016: the skill for AI assistants, saved from the app as a zip archive.
import type { SaveSkillResult } from '../../shared/ipc'
import { zip } from './zip'

/** FR-012: the folder at the root of the archive, as an upload to Claude expects */
export const SKILL_FOLDER = 'findy'

/** FR-021: the proposed file name */
export const skillArchiveName = (version: string): string => `findy-skill-${version}.zip`

/** FR-012: the archive of the skill text */
export function skillArchive(skillText: string): Uint8Array {
  return zip([
    { path: `${SKILL_FOLDER}/`, data: new Uint8Array() },
    { path: `${SKILL_FOLDER}/SKILL.md`, data: new TextEncoder().encode(skillText) },
  ])
}

export interface SkillSaverDeps {
  version: string
  /** FR-010: the skill of this version, bundled into the app */
  skillText: string
  /** System save dialog; null when the user cancels */
  pickSavePath(defaultName: string): Promise<string | null>
  writeBytes(path: string, data: Uint8Array): Promise<void>
}

/** FR-021, FR-022: works without the database and with assistant access off */
export function createSkillSaver(deps: SkillSaverDeps) {
  return {
    async save(): Promise<SaveSkillResult> {
      const path = await deps.pickSavePath(skillArchiveName(deps.version))
      if (path === null) return { status: 'cancelled' }
      await deps.writeBytes(path, skillArchive(deps.skillText))
      return { status: 'saved' }
    },
  }
}

export type SkillSaver = ReturnType<typeof createSkillSaver>
