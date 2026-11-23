import type { Lang } from '../lib/paths'
import { en, type Messages } from './en'
import { uk } from './uk'

export const MESSAGES: Record<Lang, Messages> = { en, uk }

/** One message with its `{name}` placeholders filled in */
export const format = (text: string, values: Record<string, string>): string =>
  text.replace(/\{(\w+)\}/g, (all, name: string) => values[name] ?? all)

/** A file size in megabytes, or in kilobytes below 1 MB, in the format of the language */
export function formatSize(bytes: number, lang: Lang): string {
  const mb = bytes >= 1_000_000
  return new Intl.NumberFormat(lang, {
    style: 'unit',
    unit: mb ? 'megabyte' : 'kilobyte',
    maximumFractionDigits: 0,
  }).format(bytes / (mb ? 1_000_000 : 1_000))
}
