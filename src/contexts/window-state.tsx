import { useWindowStore } from '@/stores/window';

export const useWindowState = (appName: string) => {
  const store = useWindowStore();

  return {
    isMinimized: store.isAppMinimized(appName),
    isOpen: store.isAppOpen(appName),
    onClose: () => store.closeApp(appName),
    onMinimize: () => store.minimizeApp(appName),
  };
};

export const useWindowStateContext = () => {
  return useWindowStore();
};
