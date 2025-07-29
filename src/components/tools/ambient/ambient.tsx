import { useCallback, useEffect } from 'react';
import { BiPause, BiPlay, BiUndo, BiTrash } from 'react-icons/bi';

import { Window } from '@/components/window';

import styles from './ambient.module.css';
import { Categories } from './categories';
import { useSoundStore } from '@/stores/sound';

interface AmbientProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Ambient({ isOpen, onClose }: AmbientProps) {
  return (
    <Window
      contained
      containerWidth={700}
      isOpen={isOpen}
      title="Ambient Sounds"
      windowName="ambient"
      onClose={onClose}
    >
      <AmbientContent />
    </Window>
  );
}

export function AmbientContent() {
  const globalVolume = useSoundStore(state => state.globalVolume);
  const setGlobalVolume = useSoundStore(state => state.setGlobalVolume);
  const isPlaying = useSoundStore(state => state.isPlaying);
  const togglePlay = useSoundStore(state => state.togglePlay);
  const noSelected = useSoundStore(state => state.noSelected());
  const pause = useSoundStore(state => state.pause);
  const restoreHistory = useSoundStore(state => state.restoreHistory);
  const hasHistory = useSoundStore(state => !!state.history);
  const unselectAll = useSoundStore(state => state.unselectAll);

  const handleToggle = useCallback(() => {
    if (noSelected) return;

    togglePlay();
  }, [togglePlay, noSelected]);

  useEffect(() => {
    if (isPlaying && noSelected) pause();
  }, [isPlaying, pause, noSelected]);

  const handleUnselect = useCallback(() => {
    if (hasHistory) restoreHistory();
    else if (!noSelected) unselectAll(true);
  }, [hasHistory, noSelected, unselectAll, restoreHistory]);

  useEffect(() => {
    return () => pause();
  }, [pause]);

  return (
    <>
      <div className={styles.controls}>
        <div className={styles.items}>
          <button disabled={noSelected} onClick={handleToggle}>
            {isPlaying ? <BiPause /> : <BiPlay />}
          </button>
          <button
            className={styles.trash}
            disabled={noSelected && !hasHistory}
            onClick={handleUnselect}
          >
            {hasHistory ? <BiUndo /> : <BiTrash />}
          </button>
        </div>
        <div className={styles.globalVolume}>
          <input
            max={100}
            min={0}
            type="range"
            value={globalVolume * 100}
            onChange={e => setGlobalVolume(parseInt(e.target.value, 10) / 100)}
          />
        </div>
      </div>
      <div className={styles.wrapper}>
        <Categories />
      </div>
    </>
  );
}
