import { useEffect, useId, useRef, type FormEvent, type ReactNode } from 'react'
import { IconButton } from '../IconButton'
import { CloseIcon } from '../icons'
import styles from './Dialog.module.css'

interface Props {
  title: ReactNode
  /** Line under the title, e.g. company and stage */
  subtitle?: ReactNode
  /** Content under the subtitle in the fixed header, e.g. a primary link */
  headerExtra?: ReactNode
  /** Accessible name of the × button; without it there is no × */
  closeLabel?: string
  onClose(): void
  children: ReactNode
  /** Buttons at the bottom, outside the scrolling body */
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
 * Fixed header and footer, scrolling body. Open while mounted: render it
 * conditionally, so its state starts fresh each time.
 */
export function Dialog({
  title,
  subtitle,
  headerExtra,
  closeLabel,
  onClose,
  children,
  footer,
  onSubmit,
  variant = 'modal',
  alert = false,
  testId,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const pressedOnBackdrop = useRef(false)
  const headingId = useId()

  useEffect(() => {
    const dialog = ref.current
    // The browser returns focus on dialog.close(), but this dialog is unmounted
    // instead, so return it ourselves (e.g. to the card that opened the details)
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (dialog && !dialog.open) {
      dialog.showModal()
      // showModal() focuses the first control; the dialog's own choice wins
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    }
    return () => {
      if (previous?.isConnected) previous.focus()
    }
  }, [])

  const content = (
    <>
      <header className={styles.header}>
        <div className={styles.titles}>
          <h2 id={headingId} className={styles.heading}>
            {title}
          </h2>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>
        {closeLabel && (
          <IconButton label={closeLabel} icon={<CloseIcon size={18} />} onClick={onClose} />
        )}
        {headerExtra && <div className={styles.extra}>{headerExtra}</div>}
      </header>
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
      // A click on the backdrop closes the dialog. The content fills the <dialog>
      // box, so only the backdrop has the dialog itself as the target. Both press
      // and release must be there: a text selection that ends outside must not close.
      onPointerDown={(event) => {
        pressedOnBackdrop.current = event.target === event.currentTarget
      }}
      onClick={(event) => {
        if (pressedOnBackdrop.current && event.target === event.currentTarget) onClose()
        pressedOnBackdrop.current = false
      }}
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
