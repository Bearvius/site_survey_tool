import { settingsService } from './settingsService';

export interface SimDeviceSample {
  id: number;
  rssi: number;
  per: number;
}

export function simulateDevices(): SimDeviceSample[] {
  const s = settingsService.get();
  const activeIds = s.deviceTags.filter((t) => (t.tag ?? '').trim() !== '').map((t) => t.id);
  const ids = activeIds.length > 0 ? activeIds : [1, 2, 3];
  return ids.map((id) => ({
    id,
    rssi: -50 - Math.floor(Math.random() * 30),
    per: Math.floor(Math.random() * 10)
  }));
}

export function simulateGps() {
  return {
    lat: 59.9139 + (Math.random() - 0.5) * 0.001,
    lon: 10.7522 + (Math.random() - 0.5) * 0.001,
    fix: true
  };
}
