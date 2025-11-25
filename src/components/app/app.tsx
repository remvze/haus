import { Toolbox } from '../toolbox';
import { Notepad } from '../tools/notepad';
import { Todo } from '../tools/todo';
import { WindowsProvider } from '@/contexts/windows';
import { StoreConsumer } from '../store-consumer';

import styles from './app.module.css';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Pomodoro } from '../tools/pomodoro';
import { Breathing } from '../tools/breathing';
import { Ambient } from '../tools/ambient/ambient';
import { useState } from 'react';
import { Timers } from '../tools/timers';
import { SnackbarProvider } from '@/contexts/snackbar';

export function App() {
  const [openApps, setOpenApps] = useLocalStorage<Array<string>>(
    'haus:open-windows',
    [],
  );
  const [minimizedApps, setMinimizedApps] = useState<Array<string>>([]);

  const isAppOpen = (app: string) => {
    return openApps.some(a => a === app);
  };

  const isAppMinimized = (app: string) => {
    return minimizedApps.some(a => a === app);
  };

  const openApp = (app: string) => {
    if (isAppOpen(app) && !isAppMinimized(app)) return;

    setOpenApps(prev => [...prev, app]);
    setMinimizedApps(prev => prev.filter(a => a !== app).filter(Boolean));
  };

  const closeApp = (app: string) => {
    setOpenApps(prev => prev.filter(a => a !== app).filter(Boolean));
  };

  const minimizeApp = (app: string) => {
    setMinimizedApps(prev => [...prev, app]);
  };

  return (
    <StoreConsumer>
      <SnackbarProvider>
        <WindowsProvider>
          <div className={styles.app}>
            <Toolbox
              minimizedApps={minimizedApps}
              openApp={openApp}
              openApps={openApps}
            />

            <Notepad
              isOpen={isAppOpen('notepad')}
              onClose={() => closeApp('notepad')}
            />

            <Todo isOpen={isAppOpen('todo')} onClose={() => closeApp('todo')} />

            <Pomodoro
              isMinimized={isAppMinimized('pomodoro')}
              isOpen={isAppOpen('pomodoro')}
              onClose={() => closeApp('pomodoro')}
              onMinimize={() => minimizeApp('pomodoro')}
            />

            <Breathing
              isOpen={isAppOpen('breathing')}
              onClose={() => closeApp('breathing')}
            />

            <Ambient
              isMinimized={isAppMinimized('ambient')}
              isOpen={isAppOpen('ambient')}
              onClose={() => closeApp('ambient')}
              onMinimize={() => minimizeApp('ambient')}
            />

            <Timers
              isMinimized={isAppMinimized('timers')}
              isOpen={isAppOpen('timers')}
              onClose={() => closeApp('timers')}
              onMinimize={() => minimizeApp('timers')}
            />
          </div>
        </WindowsProvider>
      </SnackbarProvider>
    </StoreConsumer>
  );
}
