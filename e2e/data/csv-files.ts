import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** Spec 008: CSV files of one test, in a folder inside its temp data directory; spec 016: the skill archive. */
export class CsvFiles {
  private readonly dir: string

  constructor(userDataDir: string) {
    this.dir = join(userDataDir, 'csv')
    mkdirSync(this.dir, { recursive: true })
  }

  path(name: string): string {
    return join(this.dir, name)
  }

  write(name: string, text: string): string {
    writeFileSync(this.path(name), text, 'utf8')
    return this.path(name)
  }

  read(name: string): string {
    return readFileSync(this.path(name), 'utf8')
  }

  bytes(name: string): Buffer {
    return readFileSync(this.path(name))
  }

  exists(name: string): boolean {
    return existsSync(this.path(name))
  }
}
