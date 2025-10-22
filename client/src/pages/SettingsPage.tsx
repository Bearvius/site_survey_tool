import React, { useEffect, useState } from 'react';
import { api } from '../lib';

type Settings = {
  modbusHost: string;
  modbusPort: number;
  modbusBaseRegister: number;
  gpsMode: 'external' | 'mobile' | 'off';
  uartPath: string;
  uartBaudRate: number;
  simulation: boolean;
  deviceTags: { id: number; tag?: string }[];
  thresholds?: { rssiGood: number; rssiWarn: number; perGood: number; perWarn: number };
};

export default function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  useEffect(() => { api.get('/settings').then((r) => setS(r.data)); }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    if (!s) return;
    setS({ ...s, [key]: value });
  }

  async function save() {
    await api.put('/settings', s);
    alert('Settings saved');
  }

  if (!s) return <div>Loading…</div>;
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 640 }}>
      <h3>Modbus</h3>
      <label>Host<input value={s.modbusHost} onChange={(e) => update('modbusHost', e.target.value)} /></label>
      <label>Port<input type="number" value={s.modbusPort} onChange={(e) => update('modbusPort', Number(e.target.value))} /></label>
      <label>Base Register<input type="number" value={s.modbusBaseRegister} onChange={(e) => update('modbusBaseRegister', Number(e.target.value))} /></label>
      <h3>GPS</h3>
      <label>Mode
        <select value={s.gpsMode} onChange={(e) => update('gpsMode', e.target.value as any)}>
          <option value="external">External GPS Chip</option>
          <option value="mobile">Mobile phone</option>
          <option value="off">Off</option>
        </select>
      </label>
      <label>UART Path<input value={s.uartPath} onChange={(e) => update('uartPath', e.target.value)} /></label>
      <label>UART Baud<input type="number" value={s.uartBaudRate} onChange={(e) => update('uartBaudRate', Number(e.target.value))} /></label>
      <h3>Simulation</h3>
      <label><input type="checkbox" checked={s.simulation} onChange={(e) => update('simulation', e.target.checked)} /> Enable simulation</label>
      <h3>Device Tags</h3>
      {s.deviceTags.map((t, idx) => (
        <div key={t.id}>
          Device {t.id}: <input value={t.tag ?? ''} onChange={(e) => {
            const deviceTags = [...s.deviceTags];
            deviceTags[idx] = { ...deviceTags[idx], tag: e.target.value };
            update('deviceTags', deviceTags);
          }} />
        </div>
      ))}
      <h3>Color Thresholds</h3>
      <small>These values control indicator colors. RSSI in dBm (negative): good is higher/less negative. PER in %: good is lower.</small>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <label>RSSI Good (≥)
          <input type="number" value={s.thresholds?.rssiGood ?? -70} onChange={(e) => update('thresholds', { ...s.thresholds, rssiGood: Number(e.target.value) } as any)} />
        </label>
        <label>RSSI Warn (≥)
          <input type="number" value={s.thresholds?.rssiWarn ?? -85} onChange={(e) => update('thresholds', { ...s.thresholds, rssiWarn: Number(e.target.value) } as any)} />
        </label>
        <label>PER Good (≤)
          <input type="number" value={s.thresholds?.perGood ?? 2} onChange={(e) => update('thresholds', { ...s.thresholds, perGood: Number(e.target.value) } as any)} />
        </label>
        <label>PER Warn (≤)
          <input type="number" value={s.thresholds?.perWarn ?? 5} onChange={(e) => update('thresholds', { ...s.thresholds, perWarn: Number(e.target.value) } as any)} />
        </label>
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={save}>Save</button>
      </div>
    </div>
  );
}
