import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface WindowState {
  closeApp: (app: string) => void;
  isAppMinimized: (app: string) => boolean;
  isAppOpen: (app: string) => boolean;
  minimizeApp: (app: string) => void;
  minimizedApps: Array<string>;
  openApp: (app: string) => void;
  openApps: Array<string>;
}

export const useWindowStore = create<WindowState>()(
  persist(
    (set, get) => ({
      closeApp: (app: string) => {
        set({
          openApps: get().openApps.filter(a => a !== app),
        });
      },
      isAppMinimized: (app: string) => {
        return get().minimizedApps.includes(app);
      },

      isAppOpen: (app: string) => {
        return get().openApps.includes(app);
      },

      minimizeApp: (app: string) => {
        set({
          minimizedApps: [...get().minimizedApps, app],
        });
      },

      minimizedApps: [],

      openApp: (app: string) => {
        const state = get();

        if (
          state.openApps.includes(app) &&
          !state.minimizedApps.includes(app)
        ) {
          return;
        }

        set({
          minimizedApps: state.minimizedApps.filter(a => a !== app),
          openApps: state.openApps.includes(app)
            ? state.openApps
            : [...state.openApps, app],
        });
      },

      openApps: [],
    }),
    {
      name: 'haus:open-windows',
      partialize: state => ({
        openApps: state.openApps,
      }),
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      version: 0,
    },
  ),
);
