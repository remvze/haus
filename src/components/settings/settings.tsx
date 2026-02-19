import { useWindowState } from '@/contexts/window-state';
import { useSettings } from '@/stores/settings';
import type { Location, PatternId } from '@/stores/settings';
import { useCallback, useEffect, useState } from 'react';
import { Modal } from '../modal';

import styles from './settings.module.css';

const PATTERN_OPTIONS: { label: string; value: PatternId }[] = [
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

export function Settings() {
  const { isOpen, onClose } = useWindowState('settings');
  const volume = useSettings(s => s.alarmVolume);
  const setVolume = useSettings(s => s.setAlarmVolume);
  const pattern = useSettings(s => s.backgroundPattern);
  const setPattern = useSettings(s => s.setBackgroundPattern);
  const location = useSettings(s => s.location);
  const setLocation = useSettings(s => s.setLocation);

  const [volumeValue, setVolumeValue] = useState(0.5);
  const [patternValue, setPatternValue] = useState<PatternId>('fire');
  const [cityInput, setCityInput] = useState('');
  const [locationValue, setLocationValue] = useState<Location | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    setVolumeValue(volume);
    setPatternValue(pattern);
    setLocationValue(location);
    setCityInput(location?.name ?? '');
  }, [volume, pattern, location, isOpen]);

  const handleGeocode = useCallback(async () => {
    if (!cityInput.trim()) return;

    setGeocoding(true);
    const result = await geocodeCity(cityInput.trim());
    setGeocoding(false);

    if (result) {
      setLocationValue(result);
      setCityInput(result.name);
    }
  }, [cityInput]);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc: Location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: `${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°`,
        };
        setLocationValue(loc);
        setCityInput(loc.name);
      },
      () => {},
    );
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setVolume(volumeValue);
    setPattern(patternValue);
    setLocation(patternValue === 'weather' ? locationValue : location);
    onClose();
  };

  return (
    <Modal show={isOpen} onClose={onClose}>
      <div className={styles.settings}>
        <h2>Haus Settings</h2>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="pattern">Background</label>
            <select
              id="pattern"
              value={patternValue}
              onChange={e => setPatternValue(e.target.value as PatternId)}
            >
              {PATTERN_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {patternValue === 'weather' && (
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
              {locationValue && (
                <span className={styles.locationInfo}>
                  {locationValue.name} ({locationValue.lat.toFixed(2)}°,{' '}
                  {locationValue.lng.toFixed(2)}°)
                </span>
              )}
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="volume">Alarm Volume</label>
            <input
              id="volume"
              max={1}
              min={0}
              step={0.1}
              type="range"
              value={volumeValue}
              onChange={e => setVolumeValue(+e.target.value)}
            />
          </div>

          {patternValue === 'weather' && (
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

          <div className={styles.buttons}>
            <button type="submit">Save</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
