import React, { useEffect, useState } from 'react';
import type { Toast as ToastType } from '../contexts/ToastContext';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, CloseIcon } from './icons';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: number) => void;
}

const icons = {
  success: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
  error: <XCircleIcon className="w-6 h-6 text-red-500" />,
  info: <InformationCircleIcon className="w-6 h-6 text-blue-500" />,
};

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 300); // Wait for exit animation
  };

  const toastEnterClass = 'animate-[toast-in_0.5s_ease-in-out_forwards]';
  const toastExitClass = 'animate-[toast-out_0.3s_ease-in-out_forwards]';

  return (
    <div
      role="alert"
      className={`relative w-full max-w-sm glass-card p-4 flex items-start space-x-3 shadow-2xl ${isExiting ? toastExitClass : toastEnterClass}`}
    >
      <div className="flex-shrink-0">{icons[toast.type]}</div>
      <div className="flex-grow text-sm font-semibold text-slate-700 dark:text-slate-200">
        {toast.message}
      </div>
      <button
        onClick={handleDismiss}
        className="p-1 rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
        aria-label="Dismiss"
      >
        <CloseIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
