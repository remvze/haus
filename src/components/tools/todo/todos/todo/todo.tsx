import { FaRegTrashAlt } from 'react-icons/fa';

import { Checkbox } from '@/components/checkbox';

import { useTodoStore } from '../../todo.store';
import { cn } from '@/helpers/styles';

import styles from './todo.module.css';

interface TodoProps {
  done: boolean;
  id: string;
  todo: string;
}

export function Todo({ done, id, todo }: TodoProps) {
  const deleteTodo = useTodoStore(state => state.deleteTodo);
  const toggleTodo = useTodoStore(state => state.toggleTodo);
  const editTodo = useTodoStore(state => state.editTodo);

  const handleCheck = () => toggleTodo(id);
  const handleDelete = () => deleteTodo(id);

  return (
    <div className={styles.wrapper}>
      <div className={styles.checkbox}>
        <Checkbox checked={done} onChange={handleCheck} />
      </div>
      <input
        className={cn(styles.textbox, done && styles.done)}
        type="text"
        value={todo}
        onChange={e => editTodo(id, e.target.value)}
      />
      <button className={styles.delete} onClick={handleDelete}>
        <FaRegTrashAlt />
      </button>
    </div>
  );
}
