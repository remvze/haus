import { useEffect } from 'react';

import { useNotepadStore } from './tools/notepad/notepad.store';
import { useTodoStore } from './tools/todo/todo.store';

interface StoreConsumerProps {
  children: React.ReactNode;
}

export function StoreConsumer({ children }: StoreConsumerProps) {
  useEffect(() => {
    useNotepadStore.persist.rehydrate();
    useTodoStore.persist.rehydrate();
  }, []);

  return <>{children}</>;
}
