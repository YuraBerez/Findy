// Entities: docs/data-model.md
import type { AnalyticsView } from './analytics'
import type { CardColor } from './colors'
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
  /** Spec 007: one colour of the palette, or none */
  color: CardColor | null
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
  /** Period and grouping of the analytics screen (spec 005) */
  analytics: AnalyticsView
  /** Check for a newer version at start, at most once a day (spec 006); off by default */
  autoUpdateCheck: boolean
}
