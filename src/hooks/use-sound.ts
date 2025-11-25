import { useMemo, useEffect, useCallback, useState } from 'react';
import { Howl } from 'howler';

import { useSSR } from './use-ssr';

export function useSound(
  src: string,
  options: { loop?: boolean; preload?: boolean; volume?: number } = {},
  html5: boolean = false,
) {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { isBrowser } = useSSR();
  const sound = useMemo<Howl | null>(() => {
    let sound: Howl | null = null;

    if (isBrowser) {
      sound = new Howl({
        html5,
        onload: () => {
          setIsLoading(false);
          setHasLoaded(true);
        },
        preload: options.preload ?? false,
        src: src,
      });

      if (window.navigator.audioSession) {
        window.navigator.audioSession.type = 'playback';
      }
    }

    return sound;
  }, [src, isBrowser, setIsLoading, html5, options.preload]);

  useEffect(() => {
    if (sound) {
      sound.loop(options.loop ?? false);
    }
  }, [sound, options.loop]);

  useEffect(() => {
    if (sound) sound.volume(options.volume ?? 0.5);
  }, [sound, options.volume]);

  const play = useCallback(
    (cb?: () => void) => {
      if (sound) {
        if (!hasLoaded && !isLoading) {
          setIsLoading(true);
          sound.load();
        }

        if (!sound.playing()) {
          sound.play();
        }

        if (typeof cb === 'function') sound.once('end', cb);
      }
    },
    [sound, hasLoaded, isLoading],
  );

  const stop = useCallback(() => {
    if (sound) sound.stop();
  }, [sound]);

  const pause = useCallback(() => {
    if (sound) sound.pause();
  }, [sound]);

  const control = useMemo(
    () => ({ isLoading, pause, play, stop }),
    [play, stop, pause, isLoading],
  );

  return control;
}
