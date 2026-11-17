// MCP tools over the same Repository and zod schemas as the app (spec 004 FR-002, FR-003).
// Pure definitions: server.ts registers them with the SDK; tests call `run` directly.
import { z } from 'zod'
import { ApplicationPatchSchema, IdSchema, LIMITS, NoteTextSchema, StageSchema, UrlSchema } from '../../domain/schema'
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

export class McpAccessDisabledError extends Error {
  constructor() {
    super(
      'Findy has AI assistant access turned off. Ask the user to open Findy and turn on ' +
        '"AI assistant access (MCP)" in the app menu (⋯).',
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

const define = <Shape extends z.ZodRawShape>(tool: ToolDefinition<Shape>) => tool as unknown as ToolDefinition

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
    notes: application.notes.length,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  }
}

function details(application: Application) {
  return {
    ...summary(application),
    notes: application.notes,
    stageHistory: application.stageHistory.map((change) => ({ ...change, stageName: STAGE_NAMES[change.stage] })),
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
        return { stages: STAGES.map((id) => ({ id, name: STAGE_NAMES[id], hidden: hiddenStages.includes(id) })) }
      },
    }),
    define({
      name: 'list_applications',
      title: 'List job applications',
      description:
        'Job applications on the board, in board order. Optional filters: a stage id, and a text that must ' +
        'appear in the title or the company (case-insensitive).',
      inputSchema: {
        stage: StageSchema.optional().describe(`Only this stage. One of: ${stageList}`),
        query: z.string().max(200).optional().describe('Text in the title or the company'),
      },
      annotations: { readOnlyHint: true },
      run: ({ stage, query }) => ({
        applications: repository
          .listApplications()
          .filter((application) => (!stage || application.stage === stage) && matchesQuery(application, query ?? ''))
          .map(summary),
      }),
    }),
    define({
      name: 'get_application',
      title: 'Get a job application',
      description: 'One application with all its notes and its stage history. Use an id from list_applications.',
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
        title: z.string().trim().min(1).max(LIMITS.title).describe('Job title, e.g. "Frontend Developer"'),
        company: z.string().trim().min(1).max(LIMITS.company).describe('Company name'),
        url: UrlSchema.optional().describe('Link to the vacancy (http or https)'),
        stage: StageSchema.optional().describe(`Default: applied. One of: ${stageList}`),
      },
      annotations: {},
      run: ({ title, company, url, stage }) => ({
        application: details(repository.createApplication({ title, company, url: url ?? null, stage })),
      }),
    }),
    define({
      name: 'update_application',
      title: 'Update a job application',
      description: 'Changes the title, the company or the vacancy link. Use move_application to change the stage.',
      inputSchema: { id: IdSchema, ...ApplicationPatchSchema.shape },
      annotations: { idempotentHint: true },
      run: ({ id, ...patch }) => ({ application: details(repository.updateApplication(id, patch)) }),
    }),
    define({
      name: 'move_application',
      title: 'Move a job application to a stage',
      description: 'Moves the application to the top of another stage and records the change in its history.',
      inputSchema: { id: IdSchema, stage: StageSchema.describe(`One of: ${stageList}`) },
      annotations: { idempotentHint: true },
      run: ({ id, stage }) => ({ application: details(repository.moveApplication(id, { stage, index: 0 })) }),
    }),
    define({
      name: 'add_note',
      title: 'Add a note to a job application',
      description: 'Adds a note, e.g. who the user talked to, salary discussed, next steps.',
      inputSchema: { id: IdSchema, text: NoteTextSchema.describe('The note; line breaks are kept') },
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
