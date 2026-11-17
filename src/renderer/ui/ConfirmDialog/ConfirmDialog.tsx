import { Button } from '../Button'
import { Dialog } from '../Dialog'

interface Props {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm(): void
  onCancel(): void
}

/** Asks before a destructive action. Cancel has focus first, so Enter never deletes by mistake. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Dialog
      alert
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button autoFocus onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p>{message}</p>
    </Dialog>
  )
}
