import { type CSSProperties, useMemo } from 'react';

import { type BackgroundPattern, useSettings } from '@/stores/settings';

import styles from './background.module.css';

const PATTERN_STYLES: Record<BackgroundPattern, CSSProperties> = {
  dots: {
    backgroundImage:
      'radial-gradient(var(--color-neutral-300) 0.7px, transparent 0.7px)',
    backgroundSize: '30px 30px',
  },
  grid: {
    backgroundImage: [
      'linear-gradient(to right, var(--color-neutral-300) 0.5px, transparent 0.5px)',
      'linear-gradient(to bottom, var(--color-neutral-300) 0.5px, transparent 0.5px)',
    ].join(', '),
    backgroundSize: '30px 30px',
  },
  none: {},
};

export const Background = () => {
  const pattern = useSettings(state => state.backgroundPattern);
  const opacity = useSettings(state => state.backgroundOpacity);

  const style = useMemo<CSSProperties>(
    () => ({
      ...PATTERN_STYLES[pattern],
      opacity,
    }),
    [pattern, opacity],
  );

  if (pattern === 'none') return null;

  return <div className={styles.background} style={style} />;
};
