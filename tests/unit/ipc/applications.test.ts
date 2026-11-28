import { beforeEach, describe, expect, it, vi } from 'vitest'
import { unwrap } from '../../../src/shared/ipc'
import { type IpcContext, setup, state } from '../helpers/ipc'

describe('applications and notes over IPC', () => {
  let ctx: IpcContext
  beforeEach(() => {
    ctx = setup()
  })

  it('runs the whole application and note lifecycle', async () => {
    const h = ctx.handlers
    let s = await state(h.createApplication({ title: ' Dev ', company: 'Acme', url: '' }))
    const id = s.applications[0]!.id
    expect(s.applications[0]).toMatchObject({ title: 'Dev', url: null })

    s = await state(h.updateApplication(id, { company: 'Globex' }))
    expect(s.applications[0]?.company).toBe('Globex')

    s = await state(h.setApplicationColor(id, 'purple'))
    expect(s.applications[0]?.color).toBe('purple')

    s = await state(h.moveApplication(id, { stage: 'offered', index: 0 }))
    expect(s.applications[0]?.stage).toBe('offered')

    s = await state(h.addNote(id, 'call'))
    const noteId = s.applications[0]!.notes[0]!.id
    s = await state(h.updateNote(id, noteId, 'call done'))
    expect(s.applications[0]?.notes[0]?.text).toBe('call done')
    s = await state(h.deleteNote(id, noteId))
    expect(s.applications[0]?.notes).toEqual([])

    s = await state(h.deleteApplication(id))
    expect(s.applications).toEqual([])
  })

  it('spec 014: saves the fields, rejects a bad salary with VALIDATION', async () => {
    const h = ctx.handlers
    let s = await state(
      h.createApplication({ title: 'Dev', company: 'Acme', url: 'https://djinni.co/jobs/1/' }),
    )
    const id = s.applications[0]!.id
    expect(s.applications[0]?.source).toEqual({ kind: 'site', id: 'djinni' })
    s = await state(h.updateApplication(id, { workFormat: 'hybrid', location: ' Kyiv ' }))
    expect(s.applications[0]).toMatchObject({ workFormat: 'hybrid', location: 'Kyiv' })
    const bad = await h.updateApplication(id, {
      salary: { min: 5, max: 1, currency: 'USD', period: 'month' },
    })
    expect(bad).toMatchObject({ ok: false, error: { code: 'VALIDATION' } })
  })

  it('deletes a stage history entry; the card follows the last entry (spec 021)', async () => {
    const h = ctx.handlers
    let s = await state(h.createApplication({ title: 'Dev', company: 'Acme', url: '' }))
    const id = s.applications[0]!.id
    s = await state(h.moveApplication(id, { stage: 'offered', index: 0 }))
    const last = s.applications[0]!.stageHistory[1]!

    expect(
      await h.deleteStageChange(id, { index: 1, stage: 'applied', at: last.at }),
    ).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } })
    expect(
      await h.deleteStageChange(id, { index: -1, stage: 'offered', at: last.at }),
    ).toMatchObject({ ok: false, error: { code: 'VALIDATION' } })

    s = await state(h.deleteStageChange(id, { index: 1, ...last }))
    expect(s.applications[0]).toMatchObject({ stage: 'applied' })
    const only = { index: 0, ...s.applications[0]!.stageHistory[0]! }
    expect(await h.deleteStageChange(id, only)).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION' },
    })
  })
})

describe('hidden stages (spec 002)', () => {
  it('saves hidden stages and keeps them over a reset', async () => {
    const ctx = setup()
    let s = await state(ctx.handlers.setHiddenStages(['rejected']))
    expect(s.settings.hiddenStages).toEqual(['rejected'])
    s = await state(ctx.handlers.resetBoard())
    expect(s.settings.hiddenStages).toEqual(['rejected'])
  })

  it('rejects hiding every stage and duplicates (FR-006)', async () => {
    const ctx = setup()
    const all = [
      'applied',
      'hr_interview',
      'test_task',
      'technical_interview',
      'c_level_interview',
      'offered',
      'rejected',
    ]
    expect(await ctx.handlers.setHiddenStages(all)).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION' },
    })
    expect(await ctx.handlers.setHiddenStages(['rejected', 'rejected'])).toMatchObject({
      ok: false,
    })
  })

  it('rejects creating or moving into a hidden stage (FR-006)', async () => {
    const ctx = setup()
    const s = await state(ctx.handlers.createApplication({ title: 'a', company: 'b' }))
    const id = s.applications[0]!.id
    await state(ctx.handlers.setHiddenStages(['offered']))
    expect(await ctx.handlers.moveApplication(id, { stage: 'offered', index: 0 })).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION' },
    })
    expect(
      await ctx.handlers.createApplication({ title: 'x', company: 'y', stage: 'offered' }),
    ).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION' },
    })
    // a visible stage still works
    expect(await ctx.handlers.moveApplication(id, { stage: 'rejected', index: 0 })).toMatchObject({
      ok: true,
    })
  })
})

describe('resetBoard (FR-090…093)', () => {
  it('backs up first, then deletes all applications', async () => {
    const order: string[] = []
    const ctx = setup({ backup: vi.fn(() => order.push('backup')) })
    await state(ctx.handlers.createApplication({ title: 'a', company: 'b' }))
    const s = await state(ctx.handlers.resetBoard())
    expect(order).toEqual(['backup'])
    expect(ctx.deps.backup).toHaveBeenCalledWith('reset')
    expect(s.applications).toEqual([])
  })

  it('deletes nothing when the backup fails', async () => {
    const ctx = setup({
      backup: vi.fn(() => {
        throw new Error('disk full')
      }),
    })
    await state(ctx.handlers.createApplication({ title: 'a', company: 'b' }))
    expect(await ctx.handlers.resetBoard()).toMatchObject({ ok: false, error: { code: 'STORAGE' } })
    expect((await state(ctx.handlers.getState())).applications).toHaveLength(1)
  })
})

describe('next step over IPC (spec 015)', () => {
  const step = { text: 'Interview', date: '2026-11-26', time: '15:00' }
  const created = async (ctx: IpcContext, nextStep: object | null = step) =>
    (await state(ctx.handlers.createApplication({ title: 'Dev', company: 'Acme', nextStep })))
      .applications[0]!

  it('sets the step on create and clears it on update; a bad step is VALIDATION', async () => {
    const ctx = setup()
    const app = await created(ctx)
    expect(app.nextStep).toEqual(step)
    const bad = await ctx.handlers.updateApplication(app.id, {
      nextStep: { text: 'x', date: '2026-02-30' },
    })
    expect(bad).toMatchObject({ ok: false, error: { code: 'VALIDATION' } })
    const cleared = await state(ctx.handlers.updateApplication(app.id, { nextStep: null }))
    expect(cleared.applications[0]!.nextStep).toBeNull()
  })

  it('"Done" writes the note in the given language (FR-012)', async () => {
    const ctx = setup()
    const app = await created(ctx)
    const result = await state(ctx.handlers.completeNextStep(app.id, 'uk'))
    const [note] = result.applications[0]!.notes
    expect(result.applications[0]!.nextStep).toBeNull()
    expect(note!.text).toMatch(/^Виконано: Interview \(26 лист\. 2026 р\.,? 15:00\)$/)
    expect(await ctx.handlers.completeNextStep(app.id, 'en')).toMatchObject({
      ok: false,
      error: { code: 'NOT_FOUND' },
    })
  })

  it('saves the calendar file of the step; NOT_FOUND without a step (FR-040)', async () => {
    const ctx = setup()
    const app = await created(ctx)
    expect(unwrap(await ctx.handlers.saveNextStepCalendar(app.id))).toEqual({ status: 'saved' })
    expect(ctx.deps.calendar.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: app.id, company: 'Acme' }),
      step,
    )
    const plain = await created(ctx, null)
    expect(await ctx.handlers.saveNextStepCalendar(plain.id)).toMatchObject({
      ok: false,
      error: { code: 'NOT_FOUND' },
    })
  })

  it('stores the Reminders switch (FR-030)', async () => {
    const ctx = setup()
    expect((await state(ctx.handlers.setRemindersEnabled(false))).settings.remindersEnabled).toBe(
      false,
    )
    expect(await ctx.handlers.setRemindersEnabled('no')).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION' },
    })
  })
})
