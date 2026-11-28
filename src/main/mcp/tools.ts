// MCP tools over the same Repository and zod schemas as the app (spec 004 FR-002, FR-003).
// Pure definitions: server.ts registers them with the SDK; tests call `run` directly.
import { z } from 'zod'
import {
  CURRENCIES,
  parseSourceText,
  SOURCE_CHANNELS,
  sourceName,
  WORK_FORMATS,
  type ApplicationSource,
  type SourceChannel,
} from '../../domain/fields'
import { CARD_COLORS } from '../../domain/colors'
import {
  ApplicationFieldsShape,
  ApplicationPatchSchema,
  CardColorSchema,
  IdSchema,
  LIMITS,
  NextStepSchema,
  NoteTextSchema,
  StageSchema,
  UrlSchema,
} from '../../domain/schema'
import { matchesQuery } from '../../domain/search'
import { STAGES, type StageId } from '../../domain/stages'
import { enteredStageAt } from '../../domain/time'
import type { Application } from '../../domain/types'
import type { Repository } from '../db/repository'

/** English stage names for the model; the UI has its own translations */
export const STAGE_NAMES: Record<StageId, string> = {
  applied: 'Applied',
  hr_interview: 'HR interview',
  test_task: 'Test task',
  technical_interview: 'Technical interview',
  c_level_interview: 'C-level interview',
  offered: 'Offer',
  rejected: 'Rejected',
}

/** Spec 014: English names of the sources that are not a job site */
export const CHANNEL_NAMES: Record<SourceChannel, string> = {
  referral: 'Referral',
  company_site: 'Company website',
  recruiter: 'Recruiter contacted me',
  other: 'Other',
}

/** Spec 014 FR-044: the source as text, like a CSV cell (plan D-4) */
const SourceTextSchema = z
  .string()
  .trim()
  .max(LIMITS.siteName)
  .nullable()
  .optional()
  .describe(
    'Where the user found the vacancy: a job site (e.g. "Djinni", "LinkedIn"), one of ' +
      `${SOURCE_CHANNELS.map((id) => `"${CHANNEL_NAMES[id]}"`).join(', ')}, or the name ` +
      "of the user's own site. Empty or null clears it. Left out on a new application " +
      'with a job site link: Findy fills it in.',
  )

/** The source text of a tool call as the repository value; undefined = not given */
function toSource(text: string | null | undefined): ApplicationSource | null | undefined {
  if (text === undefined) return undefined
  if (text === null) return null
  // The schema keeps the text within the name limit, so it never is too long here
  return parseSourceText(text, [CHANNEL_NAMES]) ?? null
}

/** Spec 014: the fields of a tool call, with the source as text */
const fieldsInput = {
  ...ApplicationFieldsShape,
  salary: ApplicationFieldsShape.salary.describe(
    `Salary range: { min, max, currency, period }. Whole numbers; at least one of min and max; ` +
      `currency one of ${CURRENCIES.join(', ')}; period "month" or "year". null clears it.`,
  ),
  workFormat: ApplicationFieldsShape.workFormat.describe(
    `One of ${WORK_FORMATS.join(', ')}; null clears it`,
  ),
  location: ApplicationFieldsShape.location.describe('City, country or time zone'),
  source: SourceTextSchema,
  contactName: ApplicationFieldsShape.contactName.describe('Name of the recruiter or contact'),
  contactDetails: ApplicationFieldsShape.contactDetails.describe(
    'How to reach the contact: email, phone, Telegram or a link',
  ),
  // Spec 015 FR-054
  nextStep: NextStepSchema.nullable()
    .optional()
    .describe(
      'The one next step: { text, date, time? }. text: one line, up to 200 characters. ' +
        'date: "YYYY-MM-DD"; time: "HH:MM" (24 h), both in the user\'s local time; no time ' +
        'means all day. It replaces the current step; null clears it.',
    ),
  // Spec 025 FR-001, FR-002
  color: CardColorSchema.optional().describe(
    `The colour of the card on the board: one of ${CARD_COLORS.join(', ')}; null removes it`,
  ),
}

export class McpAccessDisabledError extends Error {
  constructor() {
    super(
      'Findy has AI assistant access turned off. Ask the user to open Findy and turn it on ' +
        'in ⋯ → Settings… → AI assistant.',
    )
    this.name = 'McpAccessDisabledError'
  }
}

export interface ToolAnnotations {
  readOnlyHint?: boolean
  destructiveHint?: boolean
  idempotentHint?: boolean
}

export interface ToolDefinition<Shape extends z.ZodRawShape = z.ZodRawShape> {
  name: string
  title: string
  description: string
  inputSchema: Shape
  annotations: ToolAnnotations
  run(args: z.output<z.ZodObject<Shape>>): Record<string, unknown>
}

const define = <Shape extends z.ZodRawShape>(tool: ToolDefinition<Shape>) =>
  tool as unknown as ToolDefinition

const stageList = STAGES.map((stage) => `${stage} (${STAGE_NAMES[stage]})`).join(', ')

function summary(application: Application) {
  return {
    id: application.id,
    title: application.title,
    company: application.company,
    url: application.url,
    stage: application.stage,
    stageName: STAGE_NAMES[application.stage],
    inStageSince: enteredStageAt(application),
    salary: application.salary,
    workFormat: application.workFormat,
    location: application.location,
    source: application.source && sourceName(application.source, CHANNEL_NAMES),
    contactName: application.contactName,
    contactDetails: application.contactDetails,
    nextStep: application.nextStep,
    // Spec 025 FR-003
    color: application.color,
    notes: application.notes.length,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  }
}

function details(application: Application) {
  return {
    ...summary(application),
    notes: application.notes,
    stageHistory: application.stageHistory.map((change) => ({
      ...change,
      stageName: STAGE_NAMES[change.stage],
    })),
  }
}

/** All tools; each one checks the access setting first (FR-005). */
export function createTools(repository: Repository): ToolDefinition[] {
  const gate = () => {
    if (!repository.getSettings().mcpEnabled) throw new McpAccessDisabledError()
  }
  const guarded = (tool: ToolDefinition): ToolDefinition => ({
    ...tool,
    run: (args) => {
      gate()
      return tool.run(args)
    },
  })

  return [
    define({
      name: 'list_stages',
      title: 'List stages',
      description: `The stages (board columns) in order, with ids and whether each is hidden. Ids: ${stageList}.`,
      inputSchema: {},
      annotations: { readOnlyHint: true },
      run: () => {
        const { hiddenStages } = repository.getSettings()
        return {
          stages: STAGES.map((id) => ({
            id,
            name: STAGE_NAMES[id],
            hidden: hiddenStages.includes(id),
          })),
        }
      },
    }),
    define({
      name: 'list_applications',
      title: 'List job applications',
      description:
        'Job applications on the board, in board order. Optional filters: a stage id, and a text that must ' +
        'appear in the title, the company, the location, the source, the contact or the next step ' +
        '(case-insensitive).',
      inputSchema: {
        stage: StageSchema.optional().describe(`Only this stage. One of: ${stageList}`),
        query: z
          .string()
          .max(200)
          .optional()
          .describe(
            'Text in the title, the company, the location, the source, the contact or the next step',
          ),
      },
      annotations: { readOnlyHint: true },
      run: ({ stage, query }) => ({
        applications: repository
          .listApplications()
          .filter(
            (application) =>
              (!stage || application.stage === stage) &&
              matchesQuery(application, query ?? '', CHANNEL_NAMES),
          )
          .map(summary),
      }),
    }),
    define({
      name: 'get_application',
      title: 'Get a job application',
      description:
        'One application with all its notes and its stage history. Use an id from list_applications.',
      inputSchema: { id: IdSchema },
      annotations: { readOnlyHint: true },
      run: ({ id }) => ({ application: details(repository.getApplication(id)) }),
    }),
    define({
      name: 'add_application',
      title: 'Add a job application',
      description:
        'Adds an application the user applied to. It goes on top of its column. Hidden stages are not allowed.',
      inputSchema: {
        title: z
          .string()
          .trim()
          .min(1)
          .max(LIMITS.title)
          .describe('Job title, e.g. "Frontend Developer"'),
        company: z.string().trim().min(1).max(LIMITS.company).describe('Company name'),
        url: UrlSchema.optional().describe('Link to the vacancy (http or https)'),
        stage: StageSchema.optional().describe(`Default: applied. One of: ${stageList}`),
        ...fieldsInput,
      },
      annotations: {},
      run: ({ title, company, url, stage, source, ...fields }) => ({
        application: details(
          repository.createApplication({
            title,
            company,
            url: url ?? null,
            stage,
            ...fields,
            source: toSource(source),
          }),
        ),
      }),
    }),
    define({
      name: 'update_application',
      title: 'Update a job application',
      description:
        'Changes the title, the company, the vacancy link, the salary, the work format, the location, ' +
        'the source, the contact, the next step or the card colour. Only the given fields change; ' +
        'null clears a field. ' +
        'Use move_application to change the stage.',
      inputSchema: { id: IdSchema, ...ApplicationPatchSchema.shape, ...fieldsInput },
      annotations: { idempotentHint: true },
      run: ({ id, source, ...patch }) => ({
        application: details(
          repository.updateApplication(id, { ...patch, source: toSource(source) }),
        ),
      }),
    }),
    define({
      name: 'move_application',
      title: 'Move a job application to a stage',
      description:
        'Moves the application to the top of another stage and records the change in its history.',
      inputSchema: { id: IdSchema, stage: StageSchema.describe(`One of: ${stageList}`) },
      annotations: { idempotentHint: true },
      run: ({ id, stage }) => ({
        application: details(repository.moveApplication(id, { stage, index: 0 })),
      }),
    }),
    define({
      name: 'add_note',
      title: 'Add a note to a job application',
      description: 'Adds a note, e.g. who the user talked to, salary discussed, next steps.',
      inputSchema: {
        id: IdSchema,
        text: NoteTextSchema.describe('The note; line breaks are kept'),
      },
      annotations: {},
      run: ({ id, text }) => {
        repository.addNote(id, text)
        return { application: details(repository.getApplication(id)) }
      },
    }),
    define({
      name: 'delete_application',
      title: 'Delete a job application',
      description: 'Deletes the application with its notes and history. This cannot be undone.',
      inputSchema: { id: IdSchema },
      annotations: { destructiveHint: true, idempotentHint: true },
      run: ({ id }) => {
        const { title, company } = repository.getApplication(id)
        repository.deleteApplication(id)
        return { deleted: { id, title, company } }
      },
    }),
  ].map(guarded)
}
