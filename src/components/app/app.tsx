import { useMemo } from 'react';

import { SnackbarProvider } from '@/contexts/snackbar';
import { WindowsProvider } from '@/contexts/windows';
import type { AsciiPattern } from '@/lib/ascii/types';
import { FirePattern } from '@/lib/ascii/patterns/fire';
import { RainPattern } from '@/lib/ascii/patterns/rain';
import { BonsaiPattern } from '@/lib/ascii/patterns/bonsai';
import { SnowPattern } from '@/lib/ascii/patterns/snow';
import { WavePattern } from '@/lib/ascii/patterns/waves';
import { AuroraPattern } from '@/lib/ascii/patterns/aurora';
import { WeatherPattern } from '@/lib/ascii/patterns/weather/weather-pattern';
import { useSettings } from '@/stores/settings';
import type { PatternId, Location } from '@/stores/settings';
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

const createPattern = (id: PatternId, location: Location | null): AsciiPattern => {
  switch (id) {
    case 'fire': return new FirePattern({});
    case 'rain': return new RainPattern();
    case 'bonsai': return new BonsaiPattern({});
    case 'snow': return new SnowPattern({});
    case 'waves': return new WavePattern({});
    case 'aurora': return new AuroraPattern({});
    case 'weather': return new WeatherPattern(location);
    default: return new FirePattern({});
  }
};

function AppContent() {
  const patternId = useSettings(s => s.backgroundPattern);
  const location = useSettings(s => s.location);

  const pattern = useMemo(
    () => createPattern(patternId, location),
    [patternId, location],
  );

  return (
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
  );
}

export function App() {
  return (
    <StoreConsumer>
      <SnackbarProvider>
        <WindowsProvider>
          <AppContent />
        </WindowsProvider>
      </SnackbarProvider>
    </StoreConsumer>
  );
}
