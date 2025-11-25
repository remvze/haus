import { useState, useMemo } from 'react';

import { Field } from './field';

import { useTimers } from '../timers.store';

import styles from './form.module.css';

export function Form() {
  const [timerName, setTimerName] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(10);
  const [seconds, setSeconds] = useState(0);
  const [autoStart, setAutoStart] = useState(false);

  const totalSeconds = useMemo(
    () => hours * 60 * 60 + minutes * 60 + seconds,
    [hours, minutes, seconds],
  );

  const add = useTimers(state => state.add);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (totalSeconds === 0) return;

    add({
      autoStart,
      name: timerName,
      total: totalSeconds,
    });

    setTimerName('');
  };

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit}>
        <Field
          label="Timer Name"
          optional
          type="text"
          value={timerName}
          onChange={value => setTimerName(value as string)}
        />

        <div className={styles.timeFields}>
          <Field
            label="Hours"
            type="select"
            value={hours}
            onChange={value => setHours(value as number)}
          >
            {Array(13)
              .fill(null)
              .map((_, index) => (
                <option key={`hour-${index}`} value={index}>
                  {index}
                </option>
              ))}
          </Field>

          <Field
            label="Minutes"
            type="select"
            value={minutes}
            onChange={value => setMinutes(value as number)}
          >
            {Array(60)
              .fill(null)
              .map((_, index) => (
                <option key={`minutes-${index}`} value={index}>
                  {index}
                </option>
              ))}
          </Field>

          <Field
            label="Seconds"
            type="select"
            value={seconds}
            onChange={value => setSeconds(value as number)}
          >
            {Array(60)
              .fill(null)
              .map((_, index) => (
                <option key={`seconds-${index}`} value={index}>
                  {index}
                </option>
              ))}
          </Field>
        </div>

        <div className={styles.autoStart}>
          <label>
            <input
              checked={autoStart}
              type="checkbox"
              onChange={() => setAutoStart(prev => !prev)}
            />
            <span>Auto start the timer.</span>
          </label>
        </div>

        <div className={styles.buttons}>
          <button className={styles.primary} type="submit">
            Add Timer
          </button>
        </div>
      </form>
    </>
  );
}
