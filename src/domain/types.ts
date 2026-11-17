// Entities: docs/data-model.md
import type { StageId } from './stages'

export type Language = 'en' | 'uk'
export type Theme = 'system' | 'light' | 'dark'

export interface StageChange {
  stage: StageId
  at: string
}

export interface Note {
  id: string
  text: string
  createdAt: string
  updatedAt: string | null
}

export interface Application {
  id: string
  title: string
  company: string
  url: string | null
  stage: StageId
  order: number
  stageHistory: StageChange[]
  notes: Note[]
  createdAt: string
  updatedAt: string
}

export interface Settings {
  language: Language | null
  theme: Theme
  /** Columns hidden on the board (spec 002); never all of them */
  hiddenStages: StageId[]
  /** AI assistants may use the board through the MCP server (spec 004); off by default */
  mcpEnabled: boolean
}
