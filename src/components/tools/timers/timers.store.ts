import { v4 as uuid } from 'uuid';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface Timer {
  autoStart?: boolean;
  id: string;
  name: string;
  spent: number;
  total: number;
}

interface State {
  isAlarmPlaying: boolean;
  spent: () => number;
  timers: Array<Timer>;
  total: () => number;
}

interface Actions {
  add: (timer: { autoStart: boolean; name: string; total: number }) => void;
  delete: (id: string) => void;
  getTimer: (id: string) => Timer & { first: boolean; last: boolean };
  moveDown: (id: string) => void;
  moveUp: (id: string) => void;
  playAlarm: () => void;
  removeAutoStart: (id: string) => void;
  rename: (id: string, newName: string) => void;
  reset: (id: string) => void;
  stopAlarm: () => void;
  tick: (id: string, amount?: number) => void;
}

export const useTimers = create<State & Actions>()(
  persist(
    (set, get) => ({
      add({ autoStart, name, total }) {
        set(state => ({
          timers: [
            {
              autoStart: !!autoStart,
              id: uuid(),
              name,
              spent: 0,
              total,
            },
            ...state.timers,
          ],
        }));
      },

      delete(id) {
        set(state => ({
          timers: state.timers.filter(timer => timer.id !== id),
        }));
      },

      getTimer(id) {
        const timers = get().timers;
        const timer = timers.filter(timer => timer.id === id)[0];
        const index = timers.indexOf(timer);

        return {
          ...timer,
          first: index === 0,
          last: index === timers.length - 1,
        };
      },

      isAlarmPlaying: false,

      moveDown(id) {
        set(state => {
          const index = state.timers.findIndex(timer => timer.id === id);

          if (index < state.timers.length - 1) {
            const newTimers = [...state.timers];

            [newTimers[index + 1], newTimers[index]] = [
              newTimers[index],
              newTimers[index + 1],
            ];

            return { timers: newTimers };
          }

          return state;
        });
      },

      moveUp(id) {
        set(state => {
          const index = state.timers.findIndex(timer => timer.id === id);

          if (index > 0) {
            const newTimers = [...state.timers];

            [newTimers[index - 1], newTimers[index]] = [
              newTimers[index],
              newTimers[index - 1],
            ];

            return { timers: newTimers };
          }

          return state;
        });
      },

      playAlarm() {
        set({ isAlarmPlaying: true });
      },

      removeAutoStart(id) {
        set(state => ({
          timers: state.timers.map(timer => {
            if (timer.id !== id) return timer;

            delete timer.autoStart;

            return timer;
          }),
        }));
      },

      rename(id, newName) {
        set(state => ({
          timers: state.timers.map(timer => {
            if (timer.id !== id) return timer;

            return { ...timer, name: newName };
          }),
        }));
      },

      reset(id) {
        set(state => ({
          timers: state.timers.map(timer => {
            if (timer.id !== id) return timer;

            return { ...timer, spent: 0 };
          }),
        }));
      },

      spent() {
        return get().timers.reduce((prev, curr) => prev + curr.spent, 0);
      },

      stopAlarm() {
        set({ isAlarmPlaying: false });
      },

      tick(id, amount = 1) {
        set(state => ({
          timers: state.timers.map(timer => {
            if (timer.id !== id) return timer;

            const updatedSpent =
              timer.spent + amount > timer.total
                ? timer.total
                : timer.spent + amount;

            return { ...timer, spent: updatedSpent };
          }),
        }));
      },

      timers: [],

      total() {
        return get().timers.reduce((prev, curr) => prev + curr.total, 0);
      },
    }),
    {
      name: 'haus:store:timers',
      partialize: state => ({
        timers: state.timers,
      }),
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      version: 0,
    },
  ),
);
