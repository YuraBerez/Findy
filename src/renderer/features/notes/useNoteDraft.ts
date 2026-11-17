import { useState, type FormEvent } from 'react'
import { validateNote, type FieldError } from '@domain/forms'
import { useFieldErrorText } from '../../hooks/useFieldErrorText'

/** Text, validation and submit of a note being written or edited (FR-030). */
export function useNoteDraft(initial: string) {
  const errorText = useFieldErrorText()
  const [draft, setDraft] = useState(initial)
  const [error, setError] = useState<FieldError | null>(null)

  return {
    draft,
    error: errorText(error),
    change: (text: string) => setDraft(text),
    reset: (text: string) => {
      setDraft(text)
      setError(null)
    },
    /** Calls `save` with the trimmed text when it is valid. */
    submit: (save: (text: string) => Promise<unknown>) => async (event: FormEvent) => {
      event.preventDefault()
      const problem = validateNote(draft)
      setError(problem)
      if (!problem) await save(draft.trim())
    },
  }
}
