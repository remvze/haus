import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type BackgroundPattern = 'dots' | 'grid' | 'none';

interface State {
  alarmVolume: number;
  backgroundOpacity: number;
  backgroundPattern: BackgroundPattern;
}

interface Actions {
  setAlarmVolume: (volume: number) => void;
  setBackgroundOpacity: (opacity: number) => void;
  setBackgroundPattern: (pattern: BackgroundPattern) => void;
}

export const useSettings = create<State & Actions>()(
  persist(
    set => ({
      alarmVolume: 0.5,
      backgroundOpacity: 1,
      backgroundPattern: 'dots',

      setAlarmVolume(volume) {
        set({ alarmVolume: volume });
      },

      setBackgroundOpacity(opacity) {
        set({ backgroundOpacity: opacity });
      },

      setBackgroundPattern(pattern) {
        set({ backgroundPattern: pattern });
      },
    }),
    {
      migrate: (persisted, version) => {
        if (version === 0) {
          return {
            ...(persisted as State),
            backgroundOpacity: 1,
            backgroundPattern: 'dots' as BackgroundPattern,
          };
        }

        return persisted as State & Actions;
      },
      name: 'haus:store:settings',
      partialize: state => ({
        alarmVolume: state.alarmVolume,
        backgroundOpacity: state.backgroundOpacity,
        backgroundPattern: state.backgroundPattern,
      }),
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
