import type { TransferDeps } from '../../../src/main/transfer'

/** Files in memory instead of disk; dialogs answer with `path` */
export function fakeFiles(files: Record<string, string> = {}) {
  let path: string | null = '/home/me/board.csv'
  return {
    files,
    answer(next: string | null) {
      path = next
    },
    deps: {
      pickSavePath: async () => path,
      pickOpenPath: async () => path,
      fileSize: async (file: string) => Buffer.byteLength(files[file] ?? ''),
      readText: async (file: string) => files[file] ?? '',
      writeText: async (file: string, text: string) => {
        files[file] = text
      },
      now: () => new Date('2026-11-18T10:00:00.000Z'),
      newToken: () => 'token-1',
      offsetOf: () => 0,
    } satisfies Omit<TransferDeps, 'repository'>,
  }
}
