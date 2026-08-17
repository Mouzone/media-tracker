import { Dialog } from '@headlessui/react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  isDestructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Replaces `window.confirm()` for destructive actions — it sits above the modal
 * that triggers it, matches the app's styling, and traps focus properly.
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onClose={onCancel} className="relative z-[90]">
      <div className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm motion-safe:animate-fade-in" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="glass-panel w-full max-w-sm rounded-3xl p-6 motion-safe:animate-scale-in">
          <div className="flex gap-4">
            {isDestructive && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-base font-bold text-gray-900 dark:text-gray-50">
                {title}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {message}
              </Dialog.Description>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="focus-ring rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              autoFocus
              onClick={onConfirm}
              className={
                isDestructive
                  ? 'focus-ring rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700'
                  : 'focus-ring rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700'
              }
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
