import { Window } from '@/components/window';
import { useWindowState } from '@/contexts/window-state';
import { Form } from './form';
import { Todos } from './todos';

import styles from './todo.module.css';

export function Todo() {
  const { isOpen, onClose } = useWindowState('todo');

  return (
    <Window
      contained
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
