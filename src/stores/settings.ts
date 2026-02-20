import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type PatternId =
  | 'fire'
  | 'rain'
  | 'bonsai'
  | 'snow'
  | 'waves'
  | 'aurora'
  | 'weather';

export interface Location {
  lat: number;
  lng: number;
  name: string;
}

interface State {
  alarmVolume: number;
  backgroundOpacity: number;
  backgroundPattern: PatternId;
  location: Location | null;
}

interface Actions {
  setAlarmVolume: (volume: number) => void;
  setBackgroundOpacity: (opacity: number) => void;
  setBackgroundPattern: (pattern: PatternId) => void;
  setLocation: (location: Location | null) => void;
}

export const useSettings = create<State & Actions>()(
  persist(
    set => ({
      alarmVolume: 0.5,
      backgroundOpacity: 1,
      backgroundPattern: 'fire',
      location: null,

      setAlarmVolume(volume) {
        set({ alarmVolume: volume });
      },

      setBackgroundOpacity(opacity) {
        set({ backgroundOpacity: opacity });
      },

      setBackgroundPattern(pattern) {
        set({ backgroundPattern: pattern });
      },

      setLocation(location) {
        set({ location });
      },
    }),
    {
      migrate: (persisted, version) => {
        if (version === 0) {
          return {
            ...(persisted as State),
            backgroundOpacity: 1,
            backgroundPattern: 'fire' as PatternId,
            location: null,
          };
        }

        return persisted as State & Actions;
      },
      name: 'haus:store:settings',
      partialize: state => ({
        alarmVolume: state.alarmVolume,
        backgroundOpacity: state.backgroundOpacity,
        backgroundPattern: state.backgroundPattern,
        location: state.location,
      }),
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
