// Spec 016 FR-012: a zip archive of stored (not compressed) entries — enough for one small
// text file, with no library (plan D-2). Format: PKWARE APPNOTE, sections 4.3.7–4.3.16.
import { crc32 } from 'node:zlib'

export interface ZipEntry {
  /** Path inside the archive with `/` separators; a folder ends with `/` */
  path: string
  data: Uint8Array
}

const VERSION = 20 // 2.0: folders and stored entries
const UTF8_NAMES = 0x0800
// 1 January 1980, 00:00 in MS-DOS format: the same bytes for the same files
const DOS_TIME = 0
const DOS_DATE = (0 << 9) | (1 << 5) | 1

export function zip(entries: readonly ZipEntry[]): Uint8Array {
  const locals: Buffer[] = []
  const centrals: Buffer[] = []
  let offset = 0
  for (const entry of entries) {
    const name = Buffer.from(entry.path, 'utf8')
    const data = Buffer.from(entry.data)
    const crc = data.length > 0 ? crc32(data) : 0
    const folder = entry.path.endsWith('/')

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(VERSION, 4)
    local.writeUInt16LE(UTF8_NAMES, 6)
    local.writeUInt16LE(0, 8) // stored
    local.writeUInt16LE(DOS_TIME, 10)
    local.writeUInt16LE(DOS_DATE, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(name.length, 26)
    local.writeUInt16LE(0, 28)
    locals.push(local, name, data)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(VERSION, 4)
    central.writeUInt16LE(VERSION, 6)
    central.writeUInt16LE(UTF8_NAMES, 8)
    central.writeUInt16LE(0, 10)
    central.writeUInt16LE(DOS_TIME, 12)
    central.writeUInt16LE(DOS_DATE, 14)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(data.length, 20)
    central.writeUInt32LE(data.length, 24)
    central.writeUInt16LE(name.length, 28)
    // 30–41: extra and comment lengths, disk, internal attributes: 0
    central.writeUInt32LE(folder ? 0x10 : 0, 38) // MS-DOS folder attribute
    central.writeUInt32LE(offset, 42)
    centrals.push(central, name)

    offset += local.length + name.length + data.length
  }

  const directory = Buffer.concat(centrals)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(directory.length, 12)
  end.writeUInt32LE(offset, 16)
  return new Uint8Array(Buffer.concat([...locals, directory, end]))
}
