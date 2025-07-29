import type { Sounds } from '@/data/types';

import styles from './ambient.module.css';
import { Sound } from './sound';

interface SoundsProps {
  sounds: Sounds;
}

export function Sounds({ sounds }: SoundsProps) {
  return (
    <div className={styles.sounds}>
      {sounds.map(sound => (
        <Sound key={sound.id} sound={sound} />
      ))}
    </div>
  );
}
