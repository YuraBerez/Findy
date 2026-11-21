// Entities: docs/data-model.md
import type { AnalyticsView } from './analytics'
import type { CardColor } from './colors'
import type { ApplicationFields } from './fields'
import type { StageId } from './stages'
import type { KnownSiteId } from './sites'

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

/** Spec 014 adds the optional fields of `ApplicationFields` */
export interface Application extends ApplicationFields {
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
  /** Spec 010: an application is stale after this many days in its stage (3–90, default 14) */
  staleAfterDays: number
  /** Spec 011: known job sites the user hid */
  hiddenSites: KnownSiteId[]
  /** Spec 011 FR-005: the search query of the Sites tab (≤ 200 characters) */
  siteQuery: string
  /** Spec 013 FR-004: the offer question has a final answer; it is never asked again */
  offerQuestionAnswered: boolean
}
