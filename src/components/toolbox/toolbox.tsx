import { useEffect, useMemo, useState } from 'react';

import styles from './toolbox.module.css';
import { cn } from '@/helpers/styles';
import { AnimatePresence, motion } from 'motion/react';
import { useWindowStateContext } from '@/contexts/window-state';

const apps: Record<string, string> = {
  ambient: 'Ambient Sounds',
  breathing: 'Breathing Exercise',
  lofi: 'Lofi Music',
  notepad: 'Notepad',
  pomodoro: 'Pomodoro Timer',
  timers: 'Countdown Timers',
  todo: 'To-do Checklist',
};

export function Toolbox() {
  const { minimizedApps, openApp, openApps } = useWindowStateContext();
  const [selected, setSelected] = useState(Object.keys(apps)[0]);

  const notOpenApps = useMemo(
    () =>
      Object.keys(apps).filter(
        app => !openApps.includes(app) || minimizedApps.includes(app),
      ),
    [openApps, minimizedApps],
  );

  const nonMinimizedOpenApps = useMemo(
    () => openApps.filter(app => !minimizedApps.includes(app)),
    [openApps, minimizedApps],
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    openApp(selected);
  };

  useEffect(() => {
    setSelected(notOpenApps[0]);
  }, [notOpenApps]);

  return (
    <AnimatePresence>
      {nonMinimizedOpenApps.length === 0 ? (
        <div className={styles.container}>
          <motion.form
            className={styles.toolbox}
            layoutId="form"
            onSubmit={handleSubmit}
          >
            <select
              aria-label="Tool Selection"
              disabled={notOpenApps.length === 0}
              value={selected}
              onChange={e => setSelected(e.target.value)}
            >
              {notOpenApps.length > 0 ? (
                notOpenApps.map(app => (
                  <option key={app} value={app}>
                    {apps[app]} {minimizedApps.includes(app) && '(Minimized)'}
                  </option>
                ))
              ) : (
                <option value="">all apps open</option>
              )}
            </select>
            <button>Open</button>
          </motion.form>

          <div className={styles.links}>
            <a href="https://github.com/remvze/haus">Source Code</a>
            <span>|</span>
            <a href="https://coff.ee/remvze">Buy Me a Coffee</a>
          </div>
        </div>
      ) : (
        <motion.form
          className={cn(styles.toolbox, styles.fixed)}
          layoutId="form"
          onSubmit={handleSubmit}
        >
          <select
            aria-label="Tool Selection"
            disabled={notOpenApps.length === 0}
            value={selected}
            onChange={e => setSelected(e.target.value)}
          >
            {notOpenApps.length > 0 ? (
              notOpenApps.map(app => (
                <option key={app} value={app}>
                  {apps[app]} {minimizedApps.includes(app) && '(Minimized)'}
                </option>
              ))
            ) : (
              <option value="">all apps open</option>
            )}
          </select>
          <button>Open</button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
