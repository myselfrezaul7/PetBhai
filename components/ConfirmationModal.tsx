import React from 'react';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { CloseIcon, ExclamationIcon } from './icons';

const ConfirmationModal: React.FC = () => {
  const { confirmationState, resolveConfirmation } = useConfirmation();

  if (!confirmationState.isOpen) {
    return null;
  }

  const { message, title } = confirmationState;

  const handleConfirm = () => {
    resolveConfirmation(true);
  };

  const handleCancel = () => {
    resolveConfirmation(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex justify-center items-center p-4 transition-opacity duration-300 animate-fade-in"
      onClick={handleCancel}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-message"
    >
      <div
        className="glass-card w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 text-center">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/20 rounded-full mx-auto flex items-center justify-center mb-4">
                <ExclamationIcon className="w-10 h-10 text-orange-500" />
            </div>

            <h2 id="confirmation-title" className="text-2xl font-bold text-slate-800 dark:text-white">
              {title}
            </h2>
            <p id="confirmation-message" className="mt-2 text-slate-700 dark:text-slate-300">
                {message}
            </p>
            <div className="mt-8 flex justify-center space-x-4">
                <button
                    onClick={handleCancel}
                    className="px-8 py-2.5 rounded-lg font-semibold text-slate-700 dark:text-slate-200 bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300/50 dark:hover:bg-slate-600/50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleConfirm}
                    className="px-8 py-2.5 rounded-lg font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors transform hover:scale-105"
                >
                    Confirm
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
