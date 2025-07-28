import { useEffect, useRef, useMemo } from 'react';
import { Rnd } from 'react-rnd';
import { v4 as uuid } from 'uuid';
import { IoIosClose } from 'react-icons/io';
import { RiFullscreenFill, RiFullscreenExitLine } from 'react-icons/ri';

import styles from './window.module.css';
import { useWindows } from '@/contexts/windows';
import { cn } from '@/helpers/styles';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useWindowSize } from '@/hooks/use-window-size';
import { usePrevious } from '@/hooks/use-previous';

interface WindowProps {
  children: React.ReactNode;
  contained?: boolean;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  windowName: string;
}

export function Window({
  children,
  contained = false,
  isOpen,
  onClose,
  title,
  windowName,
}: WindowProps) {
  const id = useRef(uuid());
  const [position, setPosition] = useLocalStorage(
    `haus:window:${windowName}-position`,
    { x: 100, y: 100 },
  );
  const [size, setSize] = useLocalStorage(`haus:window:${windowName}-size`, {
    height: '300px',
    width: '300px',
  });
  const windowSize = useWindowSize();
  const previousPosition = usePrevious(position);
  const previousSize = usePrevious(size);

  useEffect(() => console.log({ previousPosition }), [previousPosition]);

  const { bringToFront, indices, registerWindow } = useWindows();
  const zIndex = indices[id.current];

  useEffect(() => {
    registerWindow(id.current);
  }, [registerWindow]);

  useEffect(() => {
    const handleResize = () => {
      const width = parseInt(size.width);
      const height = parseInt(size.height);

      const maxX = window.innerWidth - width;
      const maxY = window.innerHeight - height;

      setPosition(prev => ({
        x: Math.min(prev.x, Math.max(0, maxX)),
        y: Math.min(prev.y, Math.max(0, maxY)),
      }));
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [size, setPosition]);

  const isFullscreen = useMemo(() => {
    return (
      position.x === 0 &&
      position.y === 0 &&
      size.height === `${windowSize.height}px` &&
      size.width === `${windowSize.width}px`
    );
  }, [position, size, windowSize]);

  const handleFullscreen = () => {
    if (isFullscreen) {
      setPosition(previousPosition ?? { x: 100, y: 100 });
      setSize(previousSize ?? { height: '300px', width: '300px' });
    } else {
      setPosition({ x: 0, y: 0 });
      setSize({
        height: `${windowSize.height}px`,
        width: `${windowSize.width}px`,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Rnd
      bounds="parent"
      className={styles.window}
      dragHandleClassName="window-header"
      minHeight={200}
      minWidth={300}
      position={position}
      size={size}
      style={{ zIndex }}
      onDragStop={(e, d) => setPosition({ x: d.x, y: d.y })}
      onMouseDown={() => bringToFront(id.current)}
      onResizeStop={(e, direction, ref, delta, position) => {
        setSize({ height: ref.style.height, width: ref.style.width });
        setPosition({ x: position.x, y: position.y });
      }}
    >
      <header className={cn('window-header', styles.header)}>
        <h3>{title}</h3>
        <div>
          <button className={styles.fullscreen} onClick={handleFullscreen}>
            {isFullscreen ? <RiFullscreenExitLine /> : <RiFullscreenFill />}
          </button>
          <button className={styles.primary} onClick={onClose}>
            <IoIosClose />
          </button>
        </div>
      </header>
      <div className={cn(styles.content, contained && styles.contained)}>
        {children}
      </div>
    </Rnd>
  );
}
