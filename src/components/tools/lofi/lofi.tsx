import YouTube from 'react-youtube';

import { Window } from '@/components/window';

import { videos } from './videos';

import styles from './lofi.module.css';
import { padNumber } from '@/helpers/number';

export function LofiContent() {
  return (
    <div className={styles.videos}>
      {videos.map((video, index) => (
        <div className={styles.video} key={video.id}>
          <header>
            <span className={styles.index}>{padNumber(index + 1, 2)}</span>
            <strong>{video.channel}</strong>
            <span className={styles.slash}>/</span>
            <span className={styles.title}>{video.title}</span>
          </header>
          <div className={styles.container}>
            <YouTube iframeClassName={styles.iframe} videoId={video.id} />
          </div>
        </div>
      ))}
    </div>
  );
}

interface LofiProps {
  isMinimized: boolean;
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
}

export function Lofi({ isMinimized, isOpen, onClose, onMinimize }: LofiProps) {
  return (
    <Window
      contained
      containerWidth={600}
      isOpen={isOpen && !isMinimized}
      persist={isMinimized}
      title="Lofi Music"
      windowName="lofi-music"
      onClose={onClose}
      onMinimize={onMinimize}
    >
      <div className={styles.wrapper}>
        <LofiContent />
      </div>
    </Window>
  );
}
