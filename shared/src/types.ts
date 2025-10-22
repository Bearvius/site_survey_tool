export type GpsMode = 'external' | 'mobile' | 'off';

export interface DeviceTag {
  id: number; // 1..10
  tag?: string; // optional user-defined tag
}

export interface Settings {
  modbusHost: string; // IP of gateway
  modbusPort: number; // TCP port
  modbusBaseRegister: number; // default 1000
  gpsMode: GpsMode;
  uartPath: string; // e.g., /dev/ttyS0 or COM3
  uartBaudRate: number; // e.g., 9600
  simulation: boolean;
  deviceTags: DeviceTag[]; // up to 10
  // Thresholds for color-coding metrics
  thresholds?: {
    // RSSI thresholds (in dBm, negative numbers). If rssi >= rssiGood -> good; else if rssi >= rssiWarn -> warn; else bad
    rssiGood: number; // e.g., -70
    rssiWarn: number; // e.g., -85
    // PER thresholds (in %). If per <= perGood -> good; else if per <= perWarn -> warn; else bad
    perGood: number; // e.g., 2
    perWarn: number; // e.g., 5
  };
}

export interface LiveSample {
  timestamp: string; // ISO
  durationSec: number;
  devices: Array<{
    id: number;
    tag?: string;
    rssi: number; // integer 0 to -110 (negative)
    per: number; // integer 0..100
  }>;
  gps?: {
    lat?: number;
    lon?: number;
    fix: boolean;
    source: GpsMode;
  };
}

export interface MeasurementMeta {
  id: string; // filename without extension
  name: string; // location name
  timestamp: string; // ISO
  durationSec: number;
  avgRssiByDevice: Record<number, number>; // averages per device id
  avgPerByDevice: Record<number, number>;
}

export interface StartMeasurementRequest {
  location: string;
}

export interface StopMeasurementResponse {
  file: string; // saved CSV filename
}
