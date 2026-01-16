import { createContext, useContext, useState, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface WindowStateContextValue {
  openApp: (app: string) => void;
  closeApp: (app: string) => void;
  minimizeApp: (app: string) => void;
  isAppOpen: (app: string) => boolean;
  isAppMinimized: (app: string) => boolean;
  openApps: Array<string>;
  minimizedApps: Array<string>;
}

const WindowStateContext = createContext<WindowStateContextValue | undefined>(
  undefined,
);

export const useWindowState = (appName: string) => {
  const context = useContext(WindowStateContext);

  if (!context) {
    throw new Error('useWindowState must be used within WindowStateProvider');
  }

  const { isAppOpen, isAppMinimized, closeApp, minimizeApp } = context;

  return {
    isOpen: isAppOpen(appName),
    isMinimized: isAppMinimized(appName),
    onClose: () => closeApp(appName),
    onMinimize: () => minimizeApp(appName),
  };
};

export const useWindowStateContext = () => {
  const context = useContext(WindowStateContext);

  if (!context) {
    throw new Error(
      'useWindowStateContext must be used within WindowStateProvider',
    );
  }

  return context;
};

interface WindowStateProviderProps {
  children: React.ReactNode;
}

export function WindowStateProvider({ children }: WindowStateProviderProps) {
  const [openApps, setOpenApps] = useLocalStorage<Array<string>>(
    'haus:open-windows',
    [],
  );
  const [minimizedApps, setMinimizedApps] = useState<Array<string>>([]);

  const isAppOpen = useCallback(
    (app: string) => {
      return openApps.some(a => a === app);
    },
    [openApps],
  );

  const isAppMinimized = useCallback(
    (app: string) => {
      return minimizedApps.some(a => a === app);
    },
    [minimizedApps],
  );

  const openApp = useCallback(
    (app: string) => {
      if (isAppOpen(app) && !isAppMinimized(app)) return;

      setOpenApps(prev => {
        if (prev.includes(app)) return prev;
        return [...prev, app];
      });
      setMinimizedApps(prev => prev.filter(a => a !== app).filter(Boolean));
    },
    [isAppOpen, isAppMinimized, setOpenApps],
  );

  const closeApp = useCallback(
    (app: string) => {
      setOpenApps(prev => prev.filter(a => a !== app).filter(Boolean));
    },
    [setOpenApps],
  );

  const minimizeApp = useCallback(
    (app: string) => {
      setMinimizedApps(prev => [...prev, app]);
    },
    [],
  );

  return (
    <WindowStateContext.Provider
      value={{
        openApp,
        closeApp,
        minimizeApp,
        isAppOpen,
        isAppMinimized,
        openApps,
        minimizedApps,
      }}
    >
      {children}
    </WindowStateContext.Provider>
  );
}

