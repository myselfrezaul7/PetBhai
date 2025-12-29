import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmationState extends ConfirmationOptions {
  isOpen: boolean;
}

type ResolveFunction = (value: boolean) => void;

interface ConfirmationContextType {
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
  confirmationState: ConfirmationState;
  resolveConfirmation: ResolveFunction;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const ConfirmationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    message: '',
  });
  const [resolveFunction, setResolveFunction] = useState<ResolveFunction | null>(null);

  const confirm = useCallback((options: ConfirmationOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setConfirmationState({ ...options, isOpen: true });
      setResolveFunction(() => resolve);
    });
  }, []);

  const resolveConfirmation = useCallback(
    (value: boolean) => {
      if (resolveFunction) {
        resolveFunction(value);
        setConfirmationState({ isOpen: false, title: '', message: '' });
        setResolveFunction(null);
      }
    },
    [resolveFunction]
  );

  const value = { confirm, confirmationState, resolveConfirmation };

  return <ConfirmationContext.Provider value={value}>{children}</ConfirmationContext.Provider>;
};

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (context === undefined) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};
