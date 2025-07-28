import { Window } from '@/components/window';
import { Form } from './form';
import { Todos } from './todos';

import styles from './todo.module.css';

interface TodoProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Todo({ isOpen, onClose }: TodoProps) {
  return (
    <Window
      isOpen={isOpen}
      title="To-do Checklist"
      windowName="todo"
      onClose={onClose}
    >
      <div className={styles.wrapper}>
        <Form />
        <Todos />
      </div>
    </Window>
  );
}
