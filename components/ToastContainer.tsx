import React from 'react';
import { useToast } from '../contexts/ToastContext';
import Toast from './Toast';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div
      className="safe-x safe-top fixed top-16 right-0 z-[100] w-full max-w-sm space-y-3 pointer-events-none sm:right-5"
      aria-live="assertive"
      aria-relevant="additions text"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
