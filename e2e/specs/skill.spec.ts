// Spec 016: the skill for AI assistants, saved from the MCP dialog
import { expect, test } from '../fixtures/app'
import { SKILL_INSTALL_URL, SKILL_RAW_URL } from '../../src/shared/project'
import { skillInstallCommand } from '../../src/shared/skill'

test.describe('skill for AI assistants (spec 016)', () => {
  test(
    'US-1: save the skill with access off; cancel writes nothing; the install steps open',
    { tag: '@critical' },
    async ({ findy }) => {
      const { board, settings } = findy.pages
      await findy.api.captureExternalLinks()
      await settings.open('AI assistant')

      await test.step('1.1, 1.2, 1.5: saved as a zip with findy/SKILL.md, access off', async () => {
        await findy.api.answerFileDialogs(findy.files.path('skill.zip'))
        await settings.saveSkill()
        await board.verifyInfo('Skill saved. Add it to your assistant.')
        const zip = findy.files.bytes('skill.zip')
        expect(zip.readUInt32LE(0)).toBe(0x04034b50) // a zip local file header
        expect(zip.includes(Buffer.from('findy/SKILL.md'))).toBe(true)
        expect(zip.includes(Buffer.from('name: findy'))).toBe(true)
      })

      await test.step('1.4: cancel writes nothing and shows no message', async () => {
        await findy.api.answerFileDialogs(null)
        await settings.saveSkill()
        expect(findy.files.exists('other.zip')).toBe(false)
      })

      await test.step('1.6: "How to install" opens the README section', async () => {
        await settings.openSkillInstall()
        expect(await findy.api.openedLinks()).toEqual([SKILL_INSTALL_URL])
      })
    },
  )

  test('spec 017 US-1: the install command for this system, with access off; Copy', async ({
    findy,
  }) => {
    const { settings } = findy.pages
    const command = skillInstallCommand(process.platform === 'win32' ? 'powershell' : 'posix')
    await settings.open('AI assistant')
    await settings.verifySkillCommand(
      new RegExp(`^${command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
    )
    expect(command).toContain(SKILL_RAW_URL)
    await findy.api.withClipboard('', async () => {
      await settings.copySkillCommand()
      await expect.poll(() => findy.api.clipboardText()).toBe(command)
    })
  })
})
