import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import { settingsService } from './settingsService';
import { modbusPoller } from './modbusPoller';
import { simulateDevices, simulateGps } from './simulationService';
import { gpsService } from './gpsService';

type LiveDevice = { id: number; tag?: string; rssi: number; per: number };
type LiveGps = { lat?: number; lon?: number; fix: boolean; source: 'external' | 'mobile' | 'off' };
type LiveSample = { timestamp: string; durationSec: number; devices: LiveDevice[]; gps?: LiveGps };

type Listener = (s: LiveSample) => void;

class MeasurementService {
  private running = false;
  private paused = false;
  private location = '';
  private startTs: number = 0;
  private timer: NodeJS.Timeout | null = null;
  private rows: Array<{ ts: number; deviceId: number; tag?: string; rssi: number; per: number; lat?: number; lon?: number }>= [];
  private listeners: Set<Listener> = new Set();

  subscribe(cb: Listener) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(sample: LiveSample) {
    for (const l of this.listeners) l(sample);
  }

  start(location: string) {
    if (this.running) return false;
    this.running = true;
    this.paused = false;
    this.location = location || 'Unnamed';
    this.startTs = Date.now();
    this.rows = [];

    const s = settingsService.get();
    if (s.gpsMode === 'external') gpsService.start();
    else gpsService.stop();

    this.loop();
    return true;
  }

  setLocation(name: string) {
    if (!this.running) return;
    this.location = name || this.location;
  }

  isRunning() { return this.running; }

  private loop() {
    const tick = async () => {
      if (!this.running) return;
      const s = settingsService.get();
      let devices: LiveDevice[] = [];
      let gps: LiveGps | undefined = undefined;

      if (!this.paused) {
        if (s.simulation) {
          devices = simulateDevices().map((d) => ({ id: d.id, rssi: d.rssi, per: d.per, tag: s.deviceTags.find(t => t.id === d.id)?.tag || undefined }));
          if (s.gpsMode !== 'off') {
            const g = simulateGps();
            gps = { ...g, source: s.gpsMode } as LiveGps;
          }
        } else {
          const polled = await modbusPoller.readOnce();
          devices = polled.map((d) => ({ id: d.id, rssi: d.rssi, per: d.per, tag: s.deviceTags.find(t => t.id === d.id)?.tag || undefined }));
          const g = gpsService.getFix(s.gpsMode);
          gps = { ...g, source: s.gpsMode } as LiveGps;
        }

        const ts = Date.now();
        for (const d of devices) {
          this.rows.push({ ts, deviceId: d.id, tag: d.tag, rssi: d.rssi, per: d.per, lat: gps?.lat, lon: gps?.lon });
        }
      }

      const durationSec = Math.floor((Date.now() - this.startTs) / 1000);
      const sample: LiveSample = { timestamp: dayjs().toISOString(), durationSec, devices, gps };
      this.emit(sample);

      this.timer = setTimeout(tick, 1000);
    };
    this.timer = setTimeout(tick, 0);
  }

  pause() {
    if (!this.running) return;
    this.paused = true;
  }

  resume() {
    if (!this.running) return;
    this.paused = false;
  }

  stop(): string | null {
    if (!this.running) return null;
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    gpsService.stop();

    // write CSV
  const dir = path.resolve(__dirname, '../../data/measurements');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tsStr = dayjs(this.startTs).format('YYYY-MM-DD_HH-mm-ss');
    const safeName = this.location.replace(/[^a-zA-Z0-9-_]/g, '_');
    const filename = `${safeName}_${tsStr}.csv`;
    const full = path.join(dir, filename);
    const header = 'timestamp,deviceId,tag,rssi,per,lat,lon\n';
    const lines = this.rows.map(r => `${dayjs(r.ts).toISOString()},${r.deviceId},${r.tag ?? ''},${r.rssi},${r.per},${r.lat ?? ''},${r.lon ?? ''}`);
    fs.writeFileSync(full, header + lines.join('\n'), 'utf-8');

    return filename;
  }

  cancel() {
    if (!this.running) return;
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    gpsService.stop();
    this.rows = [];
  }
}

export const measurementService = new MeasurementService();
