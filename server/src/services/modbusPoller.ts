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
      // 20 registers for 10 devices (PER, RSSI) each
      const { data } = await this.client.readHoldingRegisters(base, 20);
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
      return res;
    } catch {
      // If read fails, return empty to avoid crashing; upstream may switch to simulation
      return [];
    }
  }
}

export const modbusPoller = new ModbusPoller();
