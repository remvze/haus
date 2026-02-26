import { useEffect, useRef, useState } from 'react';
import { BiPause, BiPlay } from 'react-icons/bi';

import { Window } from '@/components/window';

import styles from './somafm.module.css';

interface Stream {
  format: string;
  url: string;
}

interface Channel {
  description: string;
  id: string;
  image: string;
  lastPlaying?: string;
  playlists: Stream[];
  title: string;
}

interface SomaFMProps {
  isMinimized: boolean;
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
}

export function SomaFM({
  isMinimized,
  isOpen,
  onClose,
  onMinimize,
}: SomaFMProps) {
  return (
    <Window
      contained
      containerWidth={600}
      isOpen={isOpen && !isMinimized}
      persist={isMinimized}
      title="SomaFM Radio"
      windowName="somafm"
      onClose={onClose}
      onMinimize={onMinimize}
    >
      <SomaFMContent />
    </Window>
  );
}

function SomaFMContent(): JSX.Element {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selected, setSelected] = useState<Channel | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.7);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchChannels = async () => {
      const res = await fetch('https://api.somafm.com/channels.json');
      const data = await res.json();

      setChannels(data.channels);
    };

    fetchChannels();
  }, []);

  useEffect(() => {
    if (!selected || !audioRef.current) return;

    const audio = audioRef.current;

    audio.pause();
    audio.src = `https://ice2.somafm.com/${selected.id}-128-mp3`;
    audio.load();

    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(err => console.error(err));

    playerRef.current?.scrollIntoView({ behavior: 'smooth' });

    return () => {
      audio.pause();
    };
  }, [selected]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }

    setIsPlaying(!isPlaying);
  };

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Select a channel:</h1>

      <div className={styles.channelList}>
        {channels.map(channel => (
          <button
            key={channel.id}
            className={`${styles.channelButton} ${
              selected?.id === channel.id ? styles.active : ''
            }`}
            onClick={() => setSelected(channel)}
          >
            {channel.title}
          </button>
        ))}
      </div>

      {selected && (
        <div className={styles.player} ref={playerRef}>
          <div className={styles.info}>
            <img
              alt={selected.title}
              className={styles.cover}
              src={selected.image}
            />
            <div className={styles.side}>
              <h2>{selected.title}</h2>
              <p className={styles.description}>{selected.description}</p>

              <div className={styles.controls}>
                <button className={styles.playButton} onClick={togglePlay}>
                  {isPlaying ? <BiPause /> : <BiPlay />}
                </button>

                <input
                  className={styles.volume}
                  max="1"
                  min="0"
                  step="0.01"
                  type="range"
                  value={volume}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setVolume(Number(e.target.value))
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <audio ref={audioRef} />
    </div>
  );
}
