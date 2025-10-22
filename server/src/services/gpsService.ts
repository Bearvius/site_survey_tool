import { SerialPort } from 'serialport';
import { settingsService } from './settingsService';

type Listener = (fix: { lat?: number; lon?: number; fix: boolean }) => void;

class GpsService {
  private port: SerialPort | null = null;
  private mobileFix: { lat?: number; lon?: number; fix: boolean } | null = null;
  private listeners: Set<Listener> = new Set();

  start() {
    const s = settingsService.get();
    if (s.gpsMode !== 'external') return;
    if (this.port) return;
    this.port = new SerialPort({ path: s.uartPath, baudRate: s.uartBaudRate });
    this.port.on('data', (buf) => this.onData(buf.toString('utf-8')));
    this.port.on('error', () => {});
  }

  stop() {
    if (this.port) {
      this.port.close();
      this.port = null;
    }
  }

  setMobileFix(lat: number, lon: number) {
    this.mobileFix = { lat, lon, fix: true };
    this.emit(this.mobileFix);
  }

  getFix(source: 'external' | 'mobile' | 'off') {
    if (source === 'mobile') return this.mobileFix ?? { fix: false };
    if (source === 'external') return this.lastExternal ?? { fix: false };
    return { fix: false };
  }

  subscribe(cb: Listener) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private lastExternal: { lat?: number; lon?: number; fix: boolean } | null = null;
  private emit(fix: { lat?: number; lon?: number; fix: boolean }) {
    this.listeners.forEach((l) => l(fix));
  }

  private onData(nmea: string) {
    // Very naive NMEA GPGGA/GPRMC parsing for demo; replace with robust parser as needed
    // Example: $GPRMC,hhmmss,A,llll.ll,a,yyyyy.yy,a,x.x,x.x,ddmmyy,x.x,a*hh
    if (nmea.startsWith('$GPRMC') || nmea.startsWith('$GNRMC')) {
      const parts = nmea.split(',');
      if (parts.length > 6 && parts[2] === 'A') {
        const latRaw = parts[3];
        const latHem = parts[4];
        const lonRaw = parts[5];
        const lonHem = parts[6];
        const lat = this.dmToDec(latRaw, latHem);
        const lon = this.dmToDec(lonRaw, lonHem);
        if (lat && lon) {
          this.lastExternal = { lat, lon, fix: true };
          this.emit(this.lastExternal);
        }
      }
    }
  }

  private dmToDec(dm: string, hem: string): number | null {
    if (!dm) return null;
    const dot = dm.indexOf('.')
    if (dot < 0) return null;
    const degLen = dm.length - dot - 3; // minutes are 2 + decimals
    const deg = parseInt(dm.slice(0, degLen), 10);
    const min = parseFloat(dm.slice(degLen));
    let dec = deg + min / 60;
    if (hem === 'S' || hem === 'W') dec = -dec;
    return dec;
  }
}

export const gpsService = new GpsService();
