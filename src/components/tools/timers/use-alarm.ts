import { useCallback } from 'react';

import { useSoundEffect } from '@/hooks/use-sound-effect';
import { useTimers } from './timers.store';
import { useSettings } from '@/stores/settings';

export function useAlarm() {
  const volume = useSettings(state => state.alarmVolume);
  const { play: playSound } = useSoundEffect('/sounds/alarm.mp3', volume);
  const isPlaying = useTimers(state => state.isAlarmPlaying);
  const play = useTimers(state => state.playAlarm);
  const stop = useTimers(state => state.stopAlarm);

  const playAlarm = useCallback(() => {
    if (!isPlaying) {
      playSound(stop);
      play();
    }
  }, [isPlaying, playSound, play, stop]);

  return playAlarm;
}
