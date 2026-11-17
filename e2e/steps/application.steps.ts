import { BaseSteps } from 'playwright-e2e-kit'
import type { StageId } from '../../src/shared/ipc'
import type { ApplicationDialogScreen, ApplicationForm } from '../screens/application-dialog.screen'
import type { BoardScreen } from '../screens/board.screen'

/** Flows across the board and the dialog. */
export class ApplicationSteps extends BaseSteps {
  constructor(private readonly pages: { board: BoardScreen; dialog: ApplicationDialogScreen }) {
    super('applications')
  }

  /** US-1: toolbar → dialog → the new card on top of its column. */
  async add(
    form: ApplicationForm & { title: string },
    shownIn: StageId,
    expectedCards: string[],
  ): Promise<void> {
    await this.pages.board.startAdding()
    await this.pages.dialog.verifyOpen()
    await this.pages.dialog.fill(form)
    await this.pages.dialog.submit()
    await this.pages.dialog.verifyClosed()
    await this.pages.board.verifyCards(shownIn, expectedCards)
  }

  /** Submits the dialog and checks that it stays open and nothing was added. */
  async submitRejected(form: ApplicationForm): Promise<void> {
    await this.pages.board.startAdding()
    await this.pages.dialog.fill(form)
    await this.pages.dialog.submit()
    await this.pages.dialog.verifyOpen()
  }
}
