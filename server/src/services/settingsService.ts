import fs from 'fs';
import path from 'path';
import type { Settings } from '@shared/types';

const CONFIG_PATH = path.resolve(__dirname, '../../config/settings.json');

class SettingsService {
  private settings: Settings | null = null;

  load() {
    try {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      // Backfill defaults for newly added fields
      this.settings = {
        ...parsed,
        thresholds: parsed.thresholds ?? { rssiGood: -70, rssiWarn: -85, perGood: 2, perWarn: 5 },
      };
    } catch {
      // minimal defaults
      this.settings = {
        modbusHost: '192.168.1.100',
        modbusPort: 502,
        modbusBaseRegister: 1000,
        gpsMode: 'off',
        uartPath: 'COM3',
        uartBaudRate: 9600,
        simulation: true,
        deviceTags: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, tag: '' })),
        thresholds: { rssiGood: -70, rssiWarn: -85, perGood: 2, perWarn: 5 },
      };
      this.save();
    }
  }

  get(): Settings {
    if (!this.settings) this.load();
    return this.settings!;
  }

  update(partial: Partial<Settings>) {
    const current = this.get();
    this.settings = { ...current, ...partial } as Settings;
    // Ensure thresholds block stays complete if partially updated
    const t = (this.settings as Settings).thresholds ?? { rssiGood: -70, rssiWarn: -85, perGood: 2, perWarn: 5 };
    this.settings.thresholds = {
      rssiGood: t.rssiGood ?? -70,
      rssiWarn: t.rssiWarn ?? -85,
      perGood: t.perGood ?? 2,
      perWarn: t.perWarn ?? 5,
    };
    this.save();
  }

  save() {
    if (!this.settings) return;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.settings, null, 2), 'utf-8');
  }
}

export const settingsService = new SettingsService();
