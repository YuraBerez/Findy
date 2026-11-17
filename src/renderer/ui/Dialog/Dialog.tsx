import { useEffect, useId, useRef, type FormEvent, type ReactNode } from 'react'
import styles from './Dialog.module.css'

interface Props {
  title: ReactNode
  onClose(): void
  children: ReactNode
  /** Buttons at the bottom */
  footer?: ReactNode
  /** With a submit handler the body is a <form>, so Enter submits */
  onSubmit?(event: FormEvent<HTMLFormElement>): void
  /** `drawer` comes in from the right edge (details), `modal` is centred */
  variant?: 'modal' | 'drawer'
  /** A confirmation that interrupts the user (WAI-ARIA alertdialog) */
  alert?: boolean
  testId?: string
}

/**
 * Native modal <dialog>: focus trap, Escape and the backdrop come from the browser.
 * Open while mounted: render it conditionally, so its state starts fresh each time.
 */
export function Dialog({
  title,
  onClose,
  children,
  footer,
  onSubmit,
  variant = 'modal',
  alert = false,
  testId,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const headingId = useId()

  useEffect(() => {
    const dialog = ref.current
    // The browser returns focus on dialog.close(), but this dialog is unmounted
    // instead, so return it ourselves (e.g. to the card that opened the details)
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (dialog && !dialog.open) dialog.showModal()
    return () => {
      if (previous?.isConnected) previous.focus()
    }
  }, [])

  const content = (
    <>
      <h2 id={headingId} className={styles.heading}>
        {title}
      </h2>
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </>
  )

  return (
    <dialog
      ref={ref}
      className={[styles.dialog, styles[variant]].join(' ')}
      aria-labelledby={headingId}
      role={alert ? 'alertdialog' : undefined}
      data-testid={testId}
      // Escape closes the native dialog; keep React in charge of unmounting
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      {onSubmit ? (
        <form noValidate className={styles.content} onSubmit={onSubmit}>
          {content}
        </form>
      ) : (
        <div className={styles.content}>{content}</div>
      )}
    </dialog>
  )
}
