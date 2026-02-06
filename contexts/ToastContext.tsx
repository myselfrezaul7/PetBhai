import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const MAX_TOASTS = 5;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idCounter = useRef(0);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = ++idCounter.current;
    setToasts((prevToasts) => {
      const updated = [...prevToasts, { id, message, type }];
      // Keep only the latest MAX_TOASTS
      return updated.length > MAX_TOASTS ? updated.slice(-MAX_TOASTS) : updated;
    });
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo(() => ({ toasts, addToast, removeToast }), [toasts, addToast, removeToast]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  // Memoize convenience methods to avoid recreating them every render
  const { addToast } = context;
  const success = useCallback((message: string) => addToast(message, 'success'), [addToast]);
  const error = useCallback((message: string) => addToast(message, 'error'), [addToast]);
  const info = useCallback((message: string) => addToast(message, 'info'), [addToast]);

  return useMemo(
    () => ({
      ...context,
      success,
      error,
      info,
    }),
    [context, success, error, info]
  );
};
