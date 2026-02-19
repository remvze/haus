import { useEffect, useRef } from 'react';

import { CanvasEngine } from '@/lib/ascii/engine';
import type { AsciiPattern } from '@/lib/ascii/types';
import { useSettings } from '@/stores/settings';

import styles from './ascii-background.module.css';

interface Props {
  pattern: AsciiPattern;
}

export function AsciiBackground({ pattern }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const backgroundOpacity = useSettings(s => s.backgroundOpacity);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new CanvasEngine(canvas);
    engineRef.current = engine;
    engine.start();

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        engine.resize(width, height);
      }
    });
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      engine.stop();
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setPattern(pattern);
  }, [pattern]);

  return <canvas className={styles.canvas} ref={canvasRef} style={{ opacity: backgroundOpacity }} />;
}
