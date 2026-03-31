import React, { useCallback, useEffect, useRef } from 'react';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { CloseIcon, ExclamationIcon } from './icons';

const ConfirmationModal: React.FC = () => {
  const { confirmationState, resolveConfirmation } = useConfirmation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const { isOpen, message, title, confirmText = 'Confirm', cancelText = 'Cancel' } = confirmationState;

  const handleConfirm = useCallback(() => {
    resolveConfirmation(true);
  }, [resolveConfirmation]);

  const handleCancel = useCallback(() => {
    resolveConfirmation(false);
  }, [resolveConfirmation]);

  // Determine if this is a destructive action (delete, reset, etc.)
  const isDestructive =
    confirmText.toLowerCase().includes('delete') ||
    confirmText.toLowerCase().includes('reset') ||
    confirmText.toLowerCase().includes('remove') ||
    confirmText.toLowerCase().includes('clear');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) {
      dialog.showModal();
      cancelButtonRef.current?.focus();
    } else if (!isOpen && dialog && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      handleCancel();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={handleCancel}
      onClick={handleBackdropClick}
      className="glass-card-ios w-full max-w-md max-h-[min(92dvh,32rem)] overflow-y-auto m-auto p-0 border-0 bg-transparent shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-md open:animate-scale-in z-[60]"
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-message"
    >
      <div
        className="bg-white/95 dark:bg-zinc-900/95 w-full h-full p-6 sm:p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`w-14 h-14 sm:w-16 sm:h-16 ${isDestructive ? 'bg-red-100/80 dark:bg-red-500/20' : 'bg-orange-100/80 dark:bg-orange-500/20'} rounded-full mx-auto flex items-center justify-center mb-4 backdrop-blur-sm`}
        >
          <ExclamationIcon
            className={`w-8 h-8 sm:w-10 sm:h-10 ${isDestructive ? 'text-red-500' : 'text-orange-500'}`}
          />
        </div>

        <h2
          id="confirmation-title"
          className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white"
        >
          {title}
        </h2>
        <p
          id="confirmation-message"
          className="mt-2 text-sm sm:text-base text-slate-700 dark:text-slate-300"
        >
          {message}
        </p>
        <div className="mt-6 sm:mt-8 flex flex-col-reverse sm:flex-row justify-center gap-3 sm:space-x-4 sm:gap-0">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={handleCancel}
            className="px-6 sm:px-8 py-2.5 rounded-xl font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all duration-300 active:scale-95 touch-manipulation"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-6 sm:px-8 py-2.5 rounded-xl font-bold text-white transition-all duration-300 transform hover:scale-105 active:scale-95 touch-manipulation shadow-lg ${
              isDestructive
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:shadow-red-500/25'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:shadow-orange-500/25'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default ConfirmationModal;
