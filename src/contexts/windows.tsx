import { createContext, useContext, useState, useCallback } from 'react';

const WindowsContext = createContext<{
  bringToFront: (id: string) => void;
  indices: Record<string, number>;
  registerWindow: (id: string) => void;
}>({
  bringToFront: () => {},
  indices: {},
  registerWindow: () => {},
});

export const useWindows = () => useContext(WindowsContext);

interface WindowsProviderProps {
  children: React.ReactNode;
}

export function WindowsProvider({ children }: WindowsProviderProps) {
  const [indices, setIndices] = useState<Record<string, number>>({});

  const bringToFront = useCallback((id: string) => {
    setIndices(prev => {
      const allIndices = Object.keys(prev).map(id => prev[id]);
      const maximum = Math.max(...allIndices);

      return { ...prev, [id]: maximum < 0 ? 0 : maximum + 1 };
    });
  }, []);

  const registerWindow = useCallback(
    (id: string) => {
      if (indices[id]) return;

      bringToFront(id);
    },
    [bringToFront, indices],
  );

  return (
    <WindowsContext.Provider value={{ bringToFront, indices, registerWindow }}>
      {children}
    </WindowsContext.Provider>
  );
}
