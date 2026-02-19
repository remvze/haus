import { useMemo } from 'react';

import { SnackbarProvider } from '@/contexts/snackbar';
import { WindowsProvider } from '@/contexts/windows';
import { FirePattern } from '@/lib/ascii/patterns/fire';
import { AsciiBackground } from '../ascii-background/ascii-background';
import { Settings } from '../settings';
import { StoreConsumer } from '../store-consumer';
import { Toolbox } from '../toolbox';
import { Ambient } from '../tools/ambient/ambient';
import { Breathing } from '../tools/breathing';
import { Lofi } from '../tools/lofi';
import { Notepad } from '../tools/notepad';
import { Pomodoro } from '../tools/pomodoro';
import { Timers } from '../tools/timers';
import { Todo } from '../tools/todo';
import styles from './app.module.css';

export function App() {
  const pattern = useMemo(() => new FirePattern({}), []);

  return (
    <StoreConsumer>
      <SnackbarProvider>
        <WindowsProvider>
          <div className={styles.app}>
            <AsciiBackground pattern={pattern} />
            <Toolbox />

            <Notepad />

            <Todo />

            <Pomodoro />

            <Breathing />

            <Ambient />

            <Timers />

            <Lofi />

            <Settings />
          </div>
        </WindowsProvider>
      </SnackbarProvider>
    </StoreConsumer>
  );
}
