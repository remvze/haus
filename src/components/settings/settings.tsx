import { useEffect, useState } from 'react';

import { useSettings } from '@/stores/settings';
import { Modal } from '../modal';

import styles from './settings.module.css';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const volume = useSettings(state => state.alarmVolume);
  const setVolume = useSettings(state => state.setAlarmVolume);

  const [value, setValue] = useState(0.5);

  useEffect(() => {
    setValue(volume);
  }, [volume, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setVolume(value);
    onClose();
  };

  return (
    <Modal show={isOpen} onClose={onClose}>
      <div className={styles.settings}>
        <h2>Haus Settings</h2>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.alarmVolume}>
            <label htmlFor="volume">Alarm Volume</label>
            <input
              max={1}
              min={0}
              step={0.1}
              type="range"
              value={value}
              onChange={e => setValue(+e.target.value)}
            />
          </div>

          <div className={styles.buttons}>
            <button type="submit">Save</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
