import React, { useCallback, useEffect, useRef } from 'react';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { CloseIcon, ExclamationIcon } from './icons';

const ConfirmationModal: React.FC = () => {
  const { confirmationState, resolveConfirmation } = useConfirmation();
  const modalRef = useRef<HTMLDivElement>(null);
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
    if (!isOpen) return;

    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancel();
        return;
      }

      if (event.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex justify-center items-center p-4 transition-all duration-500 animate-fade-in"
      onClick={handleCancel}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-message"
    >
      <div
        ref={modalRef}
        className="glass-card-ios w-full max-w-md transform transition-all duration-500 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8 text-center">
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
              className="px-6 sm:px-8 py-2.5 rounded-xl font-semibold text-slate-700 dark:text-slate-200 bg-white/50 dark:bg-slate-700/50 hover:bg-white/70 dark:hover:bg-slate-600/50 border border-white/50 dark:border-slate-600/50 transition-all duration-300 active:scale-95 touch-manipulation backdrop-blur-sm"
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
      </div>
    </div>
  );
};

export default ConfirmationModal;
