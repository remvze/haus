import { useState } from 'react';
import { IoIosAdd } from 'react-icons/io';

import styles from './form.module.css';
import { useTodoStore } from '../todo.store';

export function Form() {
  const [value, setValue] = useState('');

  const addTodo = useTodoStore(state => state.addTodo);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!value.trim().length) return;

    addTodo(value);
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.wrapper}>
        <input
          placeholder="I have to ..."
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
        />
        <button type="submit">
          <IoIosAdd />
        </button>
      </div>
    </form>
  );
}
