import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import { settingsService } from './settingsService';
import { modbusPoller } from './modbusPoller';
import { simulateDevices, simulateGps } from './simulationService';
import { gpsService } from './gpsService';
import { getMeasurementsDir } from '../utils/paths';

type LiveDevice = { id: number; tag?: string; rssi: number; per: number };
type LiveGps = { lat?: number; lon?: number; fix: boolean; source: 'external' | 'mobile' | 'off' };
type MeasurementMode = 'spot' | 'continous';
type LiveSample = {
  timestamp: string;
  durationSec: number;
  devices: LiveDevice[];
  gps?: LiveGps;
  fault?: { gateway: boolean; message?: string };
  mode: MeasurementMode;
  subIndex?: number;
  subLocation?: string;
};

type Listener = (s: LiveSample) => void;

class MeasurementService {
  private running = false;
  private paused = false;
  private location = '';
  private mode: MeasurementMode = 'spot';
  private startTs: number = 0;
  private timer: NodeJS.Timeout | null = null;
  private rows: Array<{ ts: number; deviceId: number; tag?: string; rssi: number; per: number; lat?: number; lon?: number; subIndex?: number; subLocation?: string }>= [];
  private subIndex: number = 0;
  private subLocation: string = '';
  private listeners: Set<Listener> = new Set();

  subscribe(cb: Listener) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(sample: LiveSample) {
    for (const l of this.listeners) l(sample);
  }

  start(location: string, mode: MeasurementMode = 'spot') {
    if (this.running) return false;
    this.running = true;
    this.paused = false;
    this.location = location || 'Unnamed';
    this.mode = mode || 'spot';
    this.startTs = Date.now();
    this.rows = [];
    this.subIndex = 0;
    this.subLocation = '';

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

  updateSubLocation(text: string) {
    if (!this.running) return;
    // Increment index and set current label
    this.subIndex = (this.subIndex || 0) + 1;
    this.subLocation = (text || '').trim();
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
          this.rows.push({ ts, deviceId: d.id, tag: d.tag, rssi: d.rssi, per: d.per, lat: gps?.lat, lon: gps?.lon, subIndex: this.mode === 'continous' ? this.subIndex : undefined, subLocation: this.mode === 'continous' ? this.subLocation : undefined });
        }
      }

      const durationSec = Math.floor((Date.now() - this.startTs) / 1000);
      let fault: LiveSample['fault'] = undefined;
      if (!s.simulation) {
        const mstat = modbusPoller.getStatus();
        const noData = devices.length === 0;
        const stale = mstat.lastOkAt ? (Date.now() - mstat.lastOkAt > 5000) : true;
        if (noData && stale) {
          fault = { gateway: true, message: mstat.lastError || 'No data from gateway' };
        }
      }
  const sample: LiveSample = { timestamp: dayjs().toISOString(), durationSec, devices, gps, fault, mode: this.mode, subIndex: this.mode === 'continous' ? this.subIndex : undefined, subLocation: this.mode === 'continous' ? this.subLocation : undefined };
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
    const dir = getMeasurementsDir({ ensure: true });
    const tsStr = dayjs(this.startTs).format('YYYY-MM-DD_HH-mm-ss');
    const safeName = this.location.replace(/[^a-zA-Z0-9-_]/g, '_');
    const suffix = this.mode === 'continous' ? '_continous' : '';
    const filename = `${safeName}_${tsStr}${suffix}.csv`;
    const full = path.join(dir, filename);
    const header = this.mode === 'continous'
      ? 'timestamp,deviceId,tag,rssi,per,lat,lon,subIndex,subLocation\n'
      : 'timestamp,deviceId,tag,rssi,per,lat,lon\n';
    const lines = this.rows.map(r => this.mode === 'continous'
      ? `${dayjs(r.ts).toISOString()},${r.deviceId},${r.tag ?? ''},${r.rssi},${r.per},${r.lat ?? ''},${r.lon ?? ''},${r.subIndex ?? ''},${(r.subLocation ?? '').replace(/,/g,';')}`
      : `${dayjs(r.ts).toISOString()},${r.deviceId},${r.tag ?? ''},${r.rssi},${r.per},${r.lat ?? ''},${r.lon ?? ''}`
    );
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
