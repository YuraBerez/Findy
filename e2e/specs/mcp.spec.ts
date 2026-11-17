import { expect, test } from '../fixtures/app'

test.describe('MCP server (spec 004)', () => {
  test(
    'US-1: access is off until turned on in the app, and off again',
    { tag: '@critical' },
    async ({ findy }) => {
      const mcp = await findy.connectMcp()
      const { board } = findy.pages

      await test.step('1.1, 1.2: off by default; the tool says how to turn it on', async () => {
        const result = await mcp.call('list_applications')
        expect(result.isError).toBe(true)
        expect(result.text).toMatch(/turn on "AI assistant access \(MCP\)"/)
      })
      await test.step('1.3: turned on in the app, with connection instructions', async () => {
        await board.openAssistantDialog()
        await board.setAssistantAccess(true)
        await board.verifyAssistantInstructions()
        expect((await mcp.call('list_applications')).isError).toBe(false)
      })
      await test.step('1.4: off again', async () => {
        await board.setAssistantAccess(false)
        await board.closeAssistantDialog()
        expect((await mcp.call('list_applications')).isError).toBe(true)
      })
    },
  )

  test(
    'US-2, US-4: changes from the assistant show in the open app',
    { tag: '@critical' },
    async ({ findy }) => {
      await findy.api.setMcpEnabled(true)
      const mcp = await findy.connectMcp()
      const { board } = findy.pages

      const added = await mcp.call('add_application', {
        title: 'Frontend Developer',
        company: 'Acme',
        url: 'https://acme.com/jobs/1',
      })
      expect(added.isError).toBe(false)
      const id = (added.data!.application as { id: string }).id
      // FR-006: within 2 s, no reload
      await expect(async () => board.verifyCards('applied', ['Frontend Developer'])).toPass({
        timeout: 2_500,
      })

      await mcp.call('move_application', { id, stage: 'hr_interview' })
      await mcp.call('add_note', { id, text: 'Call with the recruiter on Friday' })
      await expect(async () => {
        await board.verifyCards('hr_interview', ['Frontend Developer'])
        await board.verifyCardShows('Frontend Developer', ['1 note'])
      }).toPass({ timeout: 2_500 })

      const listed = await mcp.call('list_applications', { stage: 'hr_interview' })
      expect(listed.data).toMatchObject({
        applications: [{ id, notes: 1, stageName: 'HR interview' }],
      })
    },
  )

  test('US-2.4: the same rules as the app; US-5: delete is marked destructive', async ({
    findy,
  }) => {
    await findy.api.setMcpEnabled(true)
    await findy.api.seed([{ title: 'Keep' }])
    await findy.api.setHiddenStages(['offered'])
    const mcp = await findy.connectMcp()

    expect((await mcp.call('add_application', { title: '', company: 'x' })).isError).toBe(true)
    expect(
      (await mcp.call('add_application', { title: 'a', company: 'b', url: 'javascript:alert(1)' }))
        .isError,
    ).toBe(true)
    const hidden = await mcp.call('add_application', { title: 'a', company: 'b', stage: 'offered' })
    expect(hidden.isError).toBe(true)
    expect(hidden.text).toMatch(/hidden/)

    const tools = await mcp.tools()
    expect(tools.find((tool) => tool.name === 'delete_application')!.annotations).toMatchObject({
      destructiveHint: true,
    })
    const [keep] = (await findy.api.state()).applications
    await mcp.call('delete_application', { id: keep!.id })
    await expect(async () => findy.pages.board.verifyEmptyState('No applications yet')).toPass({
      timeout: 2_500,
    })
  })

  test(
    'the assistant access dialog has no accessibility violations',
    { tag: '@a11y' },
    async ({ findy }) => {
      await findy.pages.board.openAssistantDialog()
      await findy.pages.board.setAssistantAccess(true)
      await findy.pages.a11y.expectNoViolations()
    },
  )
})
