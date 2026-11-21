import { BrowserWindow, dialog, type FileFilter } from 'electron'

/** A path from the system save dialog, owned by the focused window; null when cancelled */
export async function pickSavePath(
  defaultPath: string,
  filter: FileFilter,
): Promise<string | null> {
  const owner = BrowserWindow.getFocusedWindow()
  const options = { defaultPath, filters: [filter] }
  const result = await (owner
    ? dialog.showSaveDialog(owner, options)
    : dialog.showSaveDialog(options))
  return result.canceled ? null : (result.filePath ?? null)
}

/** A file from the system open dialog, owned by the focused window; null when cancelled */
export async function pickOpenPath(filter: FileFilter): Promise<string | null> {
  const owner = BrowserWindow.getFocusedWindow()
  const options = { properties: ['openFile' as const], filters: [filter] }
  const result = await (owner
    ? dialog.showOpenDialog(owner, options)
    : dialog.showOpenDialog(options))
  return result.canceled ? null : (result.filePaths[0] ?? null)
}
