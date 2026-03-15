import { useAutoAnimate } from '@formkit/auto-animate/react';

import { Window } from '@/components/window';
import { Timer } from './timer';
import { useWindowState } from '@/contexts/window-state';

import { useTimers } from './timers.store';

import styles from './timers.module.css';
import { Form } from './form';

export function TimersContent() {
  const [animationParent] = useAutoAnimate();
  const [animationList] = useAutoAnimate();

  const timers = useTimers(state => state.timers);

  return (
    <div ref={animationParent}>
      {timers.length > 0 ? (
        <div className={styles.timers} ref={animationList}>
          <header>
            <h2 className={styles.title}>Timers</h2>
          </header>

          {timers.map(timer => (
            <Timer id={timer.id} key={timer.id} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Timers() {
  const { isOpen, isMinimized, onClose, onMinimize } = useWindowState('timers');

  return (
    <Window
      contained
      isOpen={isOpen && !isMinimized}
      persist={isMinimized}
      title="Countdown Timers"
      windowName="countdown-timers"
      onClose={onClose}
      onMinimize={onMinimize}
    >
      <div className={styles.wrapper}>
        <Form />
        <TimersContent />
      </div>
    </Window>
  );
}
