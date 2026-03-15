import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { IoSettingsSharp } from 'react-icons/io5';

import { type PatternId, useSettings } from '@/stores/settings';
import type { Location } from '@/stores/settings';
import { Portal } from '@/components/portal';

import styles from './settings.module.css';

const PATTERN_OPTIONS: Array<{ label: string; value: PatternId }> = [
  { label: 'Fire', value: 'fire' },
  { label: 'Rain', value: 'rain' },
  { label: 'Bonsai', value: 'bonsai' },
  { label: 'Snowfall', value: 'snow' },
  { label: 'Ocean Waves', value: 'waves' },
  { label: 'Aurora', value: 'aurora' },
  { label: 'Live Weather', value: 'weather' },
];

const geocodeCity = async (query: string): Promise<Location | null> => {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const result = data.results?.[0];
  if (!result) return null;

  return {
    lat: result.latitude,
    lng: result.longitude,
    name: [result.name, result.country].filter(Boolean).join(', '),
  };
};

export const Settings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const alarmVolume = useSettings(s => s.alarmVolume);
  const setAlarmVolume = useSettings(s => s.setAlarmVolume);
  const backgroundOpacity = useSettings(s => s.backgroundOpacity);
  const setBackgroundOpacity = useSettings(s => s.setBackgroundOpacity);
  const backgroundPattern = useSettings(s => s.backgroundPattern);
  const setBackgroundPattern = useSettings(s => s.setBackgroundPattern);
  const location = useSettings(s => s.location);
  const setLocation = useSettings(s => s.setLocation);

  const [cityInput, setCityInput] = useState(location?.name ?? '');
  const [geocoding, setGeocoding] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    setCityInput(location?.name ?? '');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (
        panelRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      )
        return;

      close();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, close, location]);

  const handleGeocode = useCallback(async () => {
    if (!cityInput.trim()) return;

    setGeocoding(true);
    const result = await geocodeCity(cityInput.trim());
    setGeocoding(false);

    if (result) {
      setLocation(result);
      setCityInput(result.name);
    }
  }, [cityInput, setLocation]);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc: Location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: `${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°`,
        };
        setLocation(loc);
        setCityInput(loc.name);
      },
      () => {},
    );
  }, [setLocation]);

  return (
    <Portal>
      <button
        ref={triggerRef}
        className={styles.trigger}
        onClick={() => setIsOpen(prev => !prev)}
      >
        <IoSettingsSharp size={18} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            animate={{ opacity: 1, y: 0 }}
            className={styles.panel}
            exit={{ opacity: 0, y: 8 }}
            initial={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
          >
            <h3 className={styles.title}>Settings</h3>

            <div className={styles.field}>
              <label htmlFor="bg-pattern">Background</label>
              <select
                id="bg-pattern"
                value={backgroundPattern}
                onChange={e =>
                  setBackgroundPattern(e.target.value as PatternId)
                }
              >
                {PATTERN_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {backgroundPattern === 'weather' && (
              <div className={styles.field}>
                <label htmlFor="location">Location</label>
                <div className={styles.locationRow}>
                  <input
                    id="location"
                    placeholder="Enter city name..."
                    type="text"
                    value={cityInput}
                    onChange={e => setCityInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleGeocode();
                      }
                    }}
                  />
                  <button
                    disabled={geocoding || !cityInput.trim()}
                    type="button"
                    onClick={handleGeocode}
                  >
                    {geocoding ? '...' : 'Search'}
                  </button>
                </div>
                <button
                  className={styles.useLocation}
                  type="button"
                  onClick={handleUseMyLocation}
                >
                  Use my location
                </button>
                {location && (
                  <span className={styles.locationInfo}>
                    {location.name} ({location.lat.toFixed(2)}°,{' '}
                    {location.lng.toFixed(2)}°)
                  </span>
                )}
              </div>
            )}

            <div className={styles.field}>
              <label htmlFor="bg-opacity">Background Opacity</label>
              <input
                id="bg-opacity"
                max={1}
                min={0}
                step={0.05}
                type="range"
                value={backgroundOpacity}
                onChange={e => setBackgroundOpacity(+e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="alarm-volume">Alarm Volume</label>
              <input
                id="alarm-volume"
                max={1}
                min={0}
                step={0.1}
                type="range"
                value={alarmVolume}
                onChange={e => setAlarmVolume(+e.target.value)}
              />
            </div>

            {backgroundPattern === 'weather' && (
              <p className={styles.credit}>
                Live Weather inspired by{' '}
                <a
                  href="https://github.com/veirt/weathr"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  weathr
                </a>
              </p>
            )}

            {backgroundPattern === 'bonsai' && (
              <p className={styles.credit}>
                Bonsai inspired by{' '}
                <a
                  href="https://gitlab.com/jallbrit/cbonsai"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  cbonsai
                </a>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
};
