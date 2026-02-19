import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { IoSettingsSharp } from 'react-icons/io5';

import { type BackgroundPattern, useSettings } from '@/stores/settings';
import { Portal } from '@/components/portal';

import styles from './settings.module.css';

const PATTERN_OPTIONS: Array<{ label: string; value: BackgroundPattern }> = [
  { label: 'Dot Grid', value: 'dots' },
  { label: 'Grid Lines', value: 'grid' },
  { label: 'None', value: 'none' },
];

export const Settings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const alarmVolume = useSettings(s => s.alarmVolume);
  const setAlarmVolume = useSettings(s => s.setAlarmVolume);
  const backgroundPattern = useSettings(s => s.backgroundPattern);
  const setBackgroundPattern = useSettings(s => s.setBackgroundPattern);
  const backgroundOpacity = useSettings(s => s.backgroundOpacity);
  const setBackgroundOpacity = useSettings(s => s.setBackgroundOpacity);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (
        panelRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      )
        return;

      close();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, close]);

  return (
    <Portal>
      <button
        ref={triggerRef}
        className={styles.trigger}
        onClick={() => setIsOpen(prev => !prev)}
      >
        <IoSettingsSharp size={18} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            animate={{ opacity: 1, y: 0 }}
            className={styles.panel}
            exit={{ opacity: 0, y: 8 }}
            initial={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
          >
            <h3 className={styles.title}>Settings</h3>

            <div className={styles.field}>
              <label htmlFor="bg-pattern">Background Pattern</label>
              <select
                id="bg-pattern"
                value={backgroundPattern}
                onChange={e =>
                  setBackgroundPattern(e.target.value as BackgroundPattern)
                }
              >
                {PATTERN_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="bg-opacity">Background Opacity</label>
              <input
                id="bg-opacity"
                max={1}
                min={0}
                step={0.05}
                type="range"
                value={backgroundOpacity}
                onChange={e => setBackgroundOpacity(+e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="alarm-volume">Alarm Volume</label>
              <input
                id="alarm-volume"
                max={1}
                min={0}
                step={0.1}
                type="range"
                value={alarmVolume}
                onChange={e => setAlarmVolume(+e.target.value)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
};
