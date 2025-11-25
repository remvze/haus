import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface State {
  alarmVolume: number;
}

interface Actions {
  setAlarmVolume: (volume: number) => void;
}

export const useSettings = create<State & Actions>()(
  persist(
    set => ({
      alarmVolume: 0.5,

      setAlarmVolume(volume) {
        set({ alarmVolume: volume });
      },
    }),
    {
      name: 'haus:store:settings',
      partialize: state => ({
        volume: state.alarmVolume,
      }),
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      version: 0,
    },
  ),
);
