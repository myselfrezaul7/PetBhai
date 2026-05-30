import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PawIcon, HeartIcon } from '../components/icons';

type IslandState = 'idle' | 'notification' | 'loading' | 'success' | 'alert';

interface IslandData {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
}

interface DynamicIslandContextType {
  state: IslandState;
  data: IslandData;
  showNotification: (title: string, subtitle?: string, duration?: number) => void;
  showLoading: (title: string) => void;
  showSuccess: (title: string) => void;
  hide: () => void;
}

const DynamicIslandContext = createContext<DynamicIslandContextType | undefined>(undefined);

export const useDynamicIsland = () => {
  const context = useContext(DynamicIslandContext);
  if (!context) {
    throw new Error('useDynamicIsland must be used within a DynamicIslandProvider');
  }
  return context;
};

export const DynamicIslandProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<IslandState>('idle');
  const [data, setData] = useState<IslandData>({});

  const hide = () => {
    setState('idle');
    setData({});
  };

  const showNotification = (title: string, subtitle?: string, duration = 4000) => {
    setState('notification');
    setData({ title, subtitle, icon: <PawIcon className="w-5 h-5 text-orange-500" /> });
    if (duration > 0) {
      setTimeout(hide, duration);
    }
  };

  const showLoading = (title: string) => {
    setState('loading');
    setData({ title });
  };

  const showSuccess = (title: string) => {
    setState('success');
    setData({ title, icon: <HeartIcon className="w-5 h-5 text-emerald-500" /> });
    setTimeout(hide, 3000);
  };

  return (
    <DynamicIslandContext.Provider value={{ state, data, showNotification, showLoading, showSuccess, hide }}>
      {children}
      <div className="fixed top-2 md:top-4 left-0 right-0 z-[100] pointer-events-none flex justify-center w-full px-4 safe-top">
        <AnimatePresence mode="wait">
          {state !== 'idle' && (
            <motion.div
              initial={{ y: -20, scale: 0.9, opacity: 0, borderRadius: '24px' }}
              animate={{ 
                y: 0, 
                scale: 1, 
                opacity: 1, 
                borderRadius: '32px',
                width: state === 'loading' ? 'auto' : 'min(90vw, 380px)',
              }}
              exit={{ y: -20, scale: 0.9, opacity: 0, borderRadius: '24px' }}
              transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
              className="bg-black/90 dark:bg-black border border-white/10 shadow-2xl backdrop-blur-2xl pointer-events-auto overflow-hidden text-white flex items-center p-3"
              style={{ originY: 0 }}
            >
              <div className="flex-shrink-0 flex items-center justify-center mr-3">
                {state === 'loading' ? (
                  <div className="w-5 h-5 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                ) : (
                  data.icon
                )}
              </div>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 0.1 }}
                className="flex flex-col justify-center flex-grow"
              >
                <span className="text-[14px] font-bold leading-tight">{data.title}</span>
                {data.subtitle && (
                  <span className="text-[12px] text-zinc-400 font-medium leading-tight mt-0.5">{data.subtitle}</span>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DynamicIslandContext.Provider>
  );
};
