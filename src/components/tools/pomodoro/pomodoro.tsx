import { useState, useMemo, useEffect, useRef } from 'react';
import { IoRefresh, IoSettingsOutline } from 'react-icons/io5';

import { useLocalStorage } from '@/hooks/use-local-storage';
import { useSoundEffect } from '@/hooks/use-sound-effect';
import { Modal } from '@/components/modal';
import { Window } from '@/components/window';

import styles from './pomodoro.module.css';
import { cn } from '@/helpers/styles';

interface PomodoroProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Pomodoro({ isOpen, onClose }: PomodoroProps) {
  return (
    <Window
      contained
      isOpen={isOpen}
      title="Pomodoro Timer"
      windowName="pomodoro"
      onClose={onClose}
    >
      <PomodoroContent />
    </Window>
  );
}

export function PomodoroContent() {
  const alarm = useSoundEffect('/sounds/alarm.mp3');

  const [selectedTab, setSelectedTab] = useState('pomodoro');
  const [isRunning, setIsRunning] = useState(false);
  const [timer, setTimer] = useState(0);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const defaultTimes = useMemo(
    () => ({
      long: 15 * 60,
      pomodoro: 25 * 60,
      short: 5 * 60,
    }),
    [],
  );

  const [showSettings, setShowSettings] = useState(false);
  const [times, setTimes] = useLocalStorage<Record<string, number>>(
    'haus:pomodoro:setting',
    defaultTimes,
  );

  const [completions, setCompletions] = useState<Record<string, number>>({
    long: 0,
    pomodoro: 0,
    short: 0,
  });

  const tabs = useMemo(
    () => [
      { id: 'pomodoro', label: 'Pomodoro' },
      { id: 'short', label: 'Break' },
      { id: 'long', label: 'Long Break' },
    ],
    [],
  );

  useEffect(() => {
    if (isRunning) {
      if (interval.current) clearInterval(interval.current);

      interval.current = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else {
      if (interval.current) clearInterval(interval.current);
    }
  }, [isRunning]);

  const completionHandled = useRef(false);

  useEffect(() => {
    if (timer <= 0 && isRunning && !completionHandled.current) {
      if (interval.current) clearInterval(interval.current);

      alarm.play();

      setIsRunning(false);
      setCompletions(prev => ({
        ...prev,
        [selectedTab]: prev[selectedTab] + 1,
      }));

      completionHandled.current = true;
    } else if (timer > 0) {
      completionHandled.current = false;
    }
  }, [timer, selectedTab, isRunning, alarm]);

  useEffect(() => {
    const time = times[selectedTab] || 10;

    if (interval.current) clearInterval(interval.current);

    setIsRunning(false);
    setTimer(time);
  }, [selectedTab, times]);

  const toggleRunning = () => {
    if (isRunning) setIsRunning(false);
    else if (timer <= 0) {
      const time = times[selectedTab] || 10;

      setTimer(time);
      setIsRunning(true);
    } else setIsRunning(true);
  };

  const restart = () => {
    if (interval.current) clearInterval(interval.current);

    const time = times[selectedTab] || 10;

    setIsRunning(false);
    setTimer(time);
  };

  return (
    <>
      <div className={styles.wrapper}>
        <Tabs selectedTab={selectedTab} tabs={tabs} onSelect={setSelectedTab} />
        <Timer completed={completions[selectedTab] || 0} timer={timer} />

        <div>
          <div className={styles.buttons}>
            <button className={styles.play} onClick={toggleRunning}>
              {isRunning ? 'Pause' : 'Play'}
            </button>
            <button className={styles.reset} onClick={restart}>
              <IoRefresh />
            </button>
            <button
              className={styles.setting}
              onClick={() => setShowSettings(true)}
            >
              <IoSettingsOutline />
            </button>
          </div>
        </div>
      </div>

      <Modal show={showSettings} onClose={() => setShowSettings(false)}>
        <Settings
          times={times}
          onCancel={() => setShowSettings(false)}
          onChange={times => {
            setShowSettings(false);
            setTimes(times);
          }}
        />
      </Modal>
    </>
  );
}

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  onSelect: (id: string) => void;
  selectedTab: string;
  tabs: Tab[];
}

export function Tabs({ onSelect, selectedTab, tabs }: TabsProps) {
  return (
    <div className={styles.tabs}>
      {tabs.map(tab => (
        <button
          className={cn(selectedTab === tab.id && styles.selected)}
          key={tab.id}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

interface TimerProps {
  completed: number;
  timer: number;
}

export function Timer({ completed, timer }: TimerProps) {
  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  return (
    <div className={styles.timer}>
      <p>{completed} completed</p>
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}

interface SettingsProps {
  onCancel: () => void;
  onChange: (newTimes: Record<string, number>) => void;
  times: Record<string, number>;
}

export function Settings({ onCancel, onChange, times }: SettingsProps) {
  const [values, setValues] = useState<Record<string, number | string>>(times);

  useEffect(() => {
    setValues(times);
  }, [times]);

  const handleChange = (id: string) => (value: number | string) => {
    setValues(prev => ({
      ...prev,
      [id]: typeof value === 'number' ? value * 60 : '',
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newValues: Record<string, number> = {};

    Object.keys(values).forEach(name => {
      const value = values[name];
      newValues[name] = typeof value === 'number' ? value : times[name];
    });

    onChange(newValues);
  };

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();

    onCancel();
  };

  return (
    <div className={styles.setting}>
      <h2 className={styles.title}>Change Times</h2>

      <form className={styles.form} onSubmit={handleSubmit}>
        <Field
          id="pomodoro"
          label="Pomodoro"
          value={values.pomodoro}
          onChange={handleChange('pomodoro')}
        />
        <Field
          id="short"
          label="Short Break"
          value={values.short}
          onChange={handleChange('short')}
        />
        <Field
          id="long"
          label="Long Break"
          value={values.long}
          onChange={handleChange('long')}
        />

        <div className={styles.buttons}>
          <button type="button" onClick={handleCancel}>
            Cancel
          </button>
          <button className={styles.primary} type="submit">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  onChange: (value: number | string) => void;
  value: number | string;
}

function Field({ id, label, onChange, value }: FieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label} <span>(minutes)</span>
      </label>
      <input
        className={styles.input}
        max={120}
        min={1}
        required
        type="number"
        value={typeof value === 'number' ? value / 60 : ''}
        onChange={e => {
          onChange(e.target.value === '' ? '' : Number(e.target.value));
        }}
      />
    </div>
  );
}
