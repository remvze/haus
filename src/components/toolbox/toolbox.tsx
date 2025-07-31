import { useEffect, useMemo, useState } from 'react';

import styles from './toolbox.module.css';
import { cn } from '@/helpers/styles';
import { AnimatePresence, motion } from 'motion/react';

interface ToolboxProps {
  openApp: (app: string) => void;
  openApps: Array<string>;
}

const apps: Record<string, string> = {
  ambient: 'Ambient Sounds',
  breathing: 'Breathing Exercise',
  countdown: 'Countdown Timer',
  notepad: 'Notepad',
  pomodoro: 'Pomodoro Timer',
  todo: 'To-do Checklist',
};

export function Toolbox({ openApp, openApps }: ToolboxProps) {
  const [selected, setSelected] = useState(Object.keys(apps)[0]);

  const notOpenApps = useMemo(
    () => Object.keys(apps).filter(app => !openApps.includes(app)),
    [openApps],
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    openApp(selected);
  };

  useEffect(() => {
    setSelected(notOpenApps[0]);
  }, [notOpenApps]);

  useEffect(() => console.log({ openApps }), [openApps]);

  return (
    <AnimatePresence>
      {openApps.length === 0 ? (
        <div className={styles.container}>
          <motion.form
            className={styles.toolbox}
            layoutId="form"
            onSubmit={handleSubmit}
          >
            <select
              disabled={notOpenApps.length === 0}
              value={selected}
              onChange={e => setSelected(e.target.value)}
            >
              {notOpenApps.length > 0 ? (
                notOpenApps.map(app => (
                  <option key={app} value={app}>
                    {apps[app]}
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
            <a href="https://coff.ee/remvze">By Me a Coffee</a>
          </div>
        </div>
      ) : (
        <motion.form
          className={cn(styles.toolbox, styles.fixed)}
          layoutId="form"
          onSubmit={handleSubmit}
        >
          <select
            disabled={notOpenApps.length === 0}
            value={selected}
            onChange={e => setSelected(e.target.value)}
          >
            {notOpenApps.length > 0 ? (
              notOpenApps.map(app => (
                <option key={app} value={app}>
                  {apps[app]}
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
