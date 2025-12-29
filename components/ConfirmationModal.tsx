import React from 'react';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { CloseIcon, ExclamationIcon } from './icons';

const ConfirmationModal: React.FC = () => {
  const { confirmationState, resolveConfirmation } = useConfirmation();

  if (!confirmationState.isOpen) {
    return null;
  }

  const { message, title, confirmText = 'Confirm', cancelText = 'Cancel' } = confirmationState;

  const handleConfirm = () => {
    resolveConfirmation(true);
  };

  const handleCancel = () => {
    resolveConfirmation(false);
  };

  // Determine if this is a destructive action (delete, reset, etc.)
  const isDestructive =
    confirmText.toLowerCase().includes('delete') ||
    confirmText.toLowerCase().includes('reset') ||
    confirmText.toLowerCase().includes('remove');

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex justify-center items-center p-4 transition-opacity duration-300 animate-fade-in"
      onClick={handleCancel}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-message"
    >
      <div className="glass-card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 sm:p-8 text-center">
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 ${isDestructive ? 'bg-red-100 dark:bg-red-500/20' : 'bg-orange-100 dark:bg-orange-500/20'} rounded-full mx-auto flex items-center justify-center mb-4`}
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
              onClick={handleCancel}
              className="px-6 sm:px-8 py-2.5 rounded-lg font-semibold text-slate-700 dark:text-slate-200 bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300/50 dark:hover:bg-slate-600/50 transition-colors active:scale-95 touch-manipulation"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-6 sm:px-8 py-2.5 rounded-lg font-bold text-white transition-colors transform hover:scale-105 active:scale-95 touch-manipulation ${
                isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'
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
