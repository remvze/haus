import { useSettings } from '@/stores/settings';
import { useSoundStore } from '@/stores/sound';
import { useWindowStore } from '@/stores/window';
import { useEffect } from 'react';
import { useNotepadStore } from './tools/notepad/notepad.store';
import { useTimers } from './tools/timers/timers.store';
import { useTodoStore } from './tools/todo/todo.store';

interface StoreConsumerProps {
  children: React.ReactNode;
}

export function StoreConsumer({ children }: StoreConsumerProps) {
  useEffect(() => {
    useNotepadStore.persist.rehydrate();
    useTodoStore.persist.rehydrate();
    useSoundStore.persist.rehydrate();
    useTimers.persist.rehydrate();
    useSettings.persist.rehydrate();
    useWindowStore.persist.rehydrate();
  }, []);

  return <>{children}</>;
}
