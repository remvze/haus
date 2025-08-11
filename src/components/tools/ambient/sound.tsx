import { useCallback, useEffect, forwardRef, useMemo } from 'react';
import { ImSpinner9 } from 'react-icons/im';

import { Range } from './range';

import { useSound } from '@/hooks/use-sound';
import { useSoundStore } from '@/stores/sound';
import { cn } from '@/helpers/styles';

import styles from './ambient.module.css';

import type { Sound as SoundType } from '@/data/types';

import { useKeyboardButton } from '@/hooks/use-keyboard-button';

interface SoundProps {
  sound: SoundType;
}

export const Sound = forwardRef<HTMLDivElement, SoundProps>(function Sound(
  { sound },
  ref,
) {
  const { icon, id, label, src } = sound;

  const isPlaying = useSoundStore(state => state.isPlaying);
  const play = useSoundStore(state => state.play);
  const selectSound = useSoundStore(state => state.select);
  const unselectSound = useSoundStore(state => state.unselect);
  const setVolume = useSoundStore(state => state.setVolume);
  const isSelected = useSoundStore(state => state.sounds[id].isSelected);

  const volume = useSoundStore(state => state.sounds[id].volume);
  const globalVolume = useSoundStore(state => state.globalVolume);
  const adjustedVolume = useMemo(
    () => volume * globalVolume,
    [volume, globalVolume],
  );

  const soundPlayer = useSound(src, { loop: true, volume: adjustedVolume });

  useEffect(() => {
    if (isSelected && isPlaying) {
      soundPlayer?.play();
    } else {
      soundPlayer?.pause();
    }
  }, [isSelected, soundPlayer, isPlaying]);

  const select = useCallback(() => {
    selectSound(id);
    play();
  }, [selectSound, play, id]);

  const unselect = useCallback(() => {
    unselectSound(id);
    setVolume(id, 0.5);
  }, [unselectSound, setVolume, id]);

  const toggle = useCallback(() => {
    if (isSelected) unselect();
    else select();
  }, [isSelected, select, unselect]);

  const handleClick = useCallback(() => {
    toggle();
  }, [toggle]);

  const handleKeyDown = useKeyboardButton(() => {
    toggle();
  });

  useEffect(() => {
    return () => soundPlayer.stop();
  }, [soundPlayer]);

  return (
    <div
      aria-label={`${label} sound`}
      className={cn(styles.sound, isSelected && styles.selected)}
      ref={ref}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.details}>
        <div className={styles.icon}>
          {soundPlayer.isLoading ? (
            <span aria-hidden="true" className={styles.spinner}>
              <ImSpinner9 />
            </span>
          ) : (
            <span aria-hidden="true">{icon}</span>
          )}
        </div>
        <div className={styles.label} id={id}>
          {label}
        </div>
      </div>
      <div className={styles.rangeWrapper}>
        <Range id={id} label={label} />
      </div>
    </div>
  );
});
