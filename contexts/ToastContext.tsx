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

const MAX_VISIBLE_TOASTS = 3;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const queueRef = useRef<Toast[]>([]);
  const idCounter = useRef(0);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = ++idCounter.current;
    const nextToast = { id, message, type };

    setToasts((prevToasts) => {
      if (prevToasts.length < MAX_VISIBLE_TOASTS) {
        return [...prevToasts, nextToast];
      }

      queueRef.current = [...queueRef.current, nextToast];
      return prevToasts;
    });
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prevToasts) => {
      const updated = prevToasts.filter((toast) => toast.id !== id);
      if (updated.length >= MAX_VISIBLE_TOASTS || queueRef.current.length === 0) {
        return updated;
      }

      const [nextToast, ...remainingQueue] = queueRef.current;
      queueRef.current = remainingQueue;
      return [...updated, nextToast];
    });
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
