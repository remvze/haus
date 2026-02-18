import { useEffect, useRef } from 'react';

import { CanvasEngine } from '@/lib/ascii/engine';
import type { AsciiPattern } from '@/lib/ascii/types';

import styles from './ascii-background.module.css';

interface Props {
  pattern: AsciiPattern;
}

export function AsciiBackground({ pattern }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new CanvasEngine(canvas);
    engineRef.current = engine;
    engine.start();

    return () => engine.stop();
  }, []);

  useEffect(() => {
    engineRef.current?.setPattern(pattern);
  }, [pattern]);

  return <canvas className={styles.canvas} ref={canvasRef} />;
}
