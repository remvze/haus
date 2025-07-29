import { useEffect } from 'react';

import { useNotepadStore } from './tools/notepad/notepad.store';
import { useTodoStore } from './tools/todo/todo.store';
import { useSoundStore } from '@/stores/sound';

interface StoreConsumerProps {
  children: React.ReactNode;
}

export function StoreConsumer({ children }: StoreConsumerProps) {
  useEffect(() => {
    useNotepadStore.persist.rehydrate();
    useTodoStore.persist.rehydrate();
    useSoundStore.persist.rehydrate();
  }, []);

  return <>{children}</>;
}
