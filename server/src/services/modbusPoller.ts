import ModbusRTU from 'modbus-serial';
import { settingsService } from './settingsService';

export interface PolledDevice {
  id: number;
  rssi: number;
  per: number;
}

export class ModbusPoller {
  private client = new ModbusRTU();
  private connected = false;
  private lastError: string | null = null;
  private lastOkAt: number | null = null;

  async connect() {
    const s = settingsService.get();
    if (this.connected) return;
    await this.client.connectTCP(s.modbusHost, { port: s.modbusPort });
    this.connected = true;
  }

  async readOnce(): Promise<PolledDevice[]> {
    const s = settingsService.get();
    try {
      if (!this.connected) await this.connect();
      const base = s.modbusBaseRegister;
      // 20 registers for 10 devices (PER, RSSI) each with a safety timeout
      const readPromise = this.client.readHoldingRegisters(base, 20);
      const { data } = await Promise.race([
        readPromise,
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('Modbus read timeout')), 2000)),
      ]);
      const res: PolledDevice[] = [];

      const toInt16 = (v: number) => (v & 0x8000 ? v - 0x10000 : v);
      const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
      for (let i = 0; i < 10; i++) {
        const perRaw = data[i * 2];
        const rssiRaw = data[i * 2 + 1];
        const mapped = !(perRaw === 0 && rssiRaw === 0);
        if (mapped) {
          const rssiSigned = toInt16(rssiRaw);
          const rssi = clamp(rssiSigned, -110, 0);
          const per = clamp(perRaw, 0, 100);
          res.push({ id: i + 1, per, rssi });
        }
      }
      // success
      this.lastOkAt = Date.now();
      this.lastError = null;
      return res;
    } catch (e: any) {
      // If read fails, return empty and record error
      this.lastError = e?.message || String(e) || 'Unknown Modbus error';
      return [];
    }
  }

  getStatus() {
    return { lastError: this.lastError, lastOkAt: this.lastOkAt };
  }
}

export const modbusPoller = new ModbusPoller();
