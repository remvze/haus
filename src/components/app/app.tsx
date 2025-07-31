import { Toolbox } from '../toolbox';
import { Notepad } from '../tools/notepad';
import { Todo } from '../tools/todo';
import { WindowsProvider } from '@/contexts/windows';
import { StoreConsumer } from '../store-consumer';

import styles from './app.module.css';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Countdown } from '../tools/countdown';
import { Pomodoro } from '../tools/pomodoro';
import { Breathing } from '../tools/breathing';
import { Ambient } from '../tools/ambient/ambient';

export function App() {
  const [openApps, setOpenApps] = useLocalStorage<Array<string>>(
    'haus:open-windows',
    [],
  );

  const isAppOpen = (app: string) => {
    return openApps.some(a => a === app);
  };

  const openApp = (app: string) => {
    if (isAppOpen(app)) return;

    setOpenApps(prev => [...prev, app]);
  };

  const closeApp = (app: string) => {
    setOpenApps(prev => prev.filter(a => a !== app).filter(Boolean));
  };

  return (
    <StoreConsumer>
      <WindowsProvider>
        <div className={styles.app}>
          <Toolbox openApp={openApp} openApps={openApps} />

          <Notepad
            isOpen={isAppOpen('notepad')}
            onClose={() => closeApp('notepad')}
          />

          <Todo isOpen={isAppOpen('todo')} onClose={() => closeApp('todo')} />

          <Countdown
            isOpen={isAppOpen('countdown')}
            onClose={() => closeApp('countdown')}
          />

          <Pomodoro
            isOpen={isAppOpen('pomodoro')}
            onClose={() => closeApp('pomodoro')}
          />

          <Breathing
            isOpen={isAppOpen('breathing')}
            onClose={() => closeApp('breathing')}
          />

          <Ambient
            isOpen={isAppOpen('ambient')}
            onClose={() => closeApp('ambient')}
          />
        </div>
      </WindowsProvider>
    </StoreConsumer>
  );
}
