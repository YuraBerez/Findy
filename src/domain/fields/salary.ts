// Spec 014 FR-001…FR-003: the rules of a salary range.
import { LIMITS } from '../limits'
import type { Salary } from './types'

export type SalaryProblem = 'invalid' | 'order'

/** A whole number 0…1 000 000 000 (FR-001) */
export function isSalaryAmount(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= LIMITS.salary
}

/** `null` for a valid salary; else what is wrong with it */
export function salaryProblem(salary: Salary): SalaryProblem | null {
  const amounts = [salary.min, salary.max].filter((value) => value !== null)
  if (amounts.length === 0 || !amounts.every(isSalaryAmount)) return 'invalid'
  if (salary.min !== null && salary.max !== null && salary.min > salary.max) return 'order'
  return null
}

/**
 * An amount as a person types it: digits with optional spaces or thousands separators.
 * `null` for empty text, `undefined` for text that is not an amount.
 */
export function parseAmount(text: string): number | null | undefined {
  const digits = text.replace(/[\s\u00a0\u202f,.'\u2019]/g, '')
  if (!digits) return text.trim() ? undefined : null
  if (!/^\d+$/.test(digits)) return undefined
  const value = Number(digits)
  return isSalaryAmount(value) ? value : undefined
}
