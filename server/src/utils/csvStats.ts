import fs from 'fs';
import dayjs from 'dayjs';

export type CsvRow = { ts: number; deviceId: number; tag?: string; rssi: number; per: number; lat?: number; lon?: number; subIndex?: number; subLocation?: string };

export function parseCsv(filePath: string): CsvRow[] {
  const text = fs.readFileSync(filePath, 'utf-8');
  const lines = text.split(/\r?\n/);
  const rows: CsvRow[] = [];
  if (lines.length <= 1) return rows;
  const header = lines[0].split(',');
  const hasSub = header.includes('subIndex') && header.includes('subLocation');
  for (let i = 1; i < lines.length; i++) { // skip header
    const line = lines[i];
    if (!line) continue;
    const cols = line.split(',');
    const [tsStr, deviceIdStr, tag, rssiStr, perStr, latStr, lonStr, subIndexStr, subLocationStr] = cols as any;
    const ts = dayjs(tsStr).valueOf();
    const deviceId = Number(deviceIdStr);
    const rssi = Number(rssiStr);
    const per = Number(perStr);
    const lat = latStr ? Number(latStr) : undefined;
    const lon = lonStr ? Number(lonStr) : undefined;
    const subIndex = hasSub && subIndexStr ? Number(subIndexStr) : undefined;
    const subLocation = hasSub ? (subLocationStr || undefined) : undefined;
    if (Number.isFinite(ts) && deviceId) {
      rows.push({ ts, deviceId, tag: tag || undefined, rssi, per, lat, lon, subIndex, subLocation });
    }
  }
  return rows;
}

export function computeStats(rows: CsvRow[]) {
  if (rows.length === 0) return { durationSec: 0, avgRssi: 0, avgPer: 0 };
  const sorted = rows.slice().sort((a, b) => a.ts - b.ts);
  const durationSec = Math.max(0, Math.round((sorted[sorted.length - 1].ts - sorted[0].ts) / 1000));
  let sumRssi = 0, sumPer = 0, n = 0;
  for (const r of rows) {
    sumRssi += r.rssi; sumPer += r.per; n++;
  }
  const avgRssi = Math.round(sumRssi / n);
  const avgPer = Math.round(sumPer / n);
  return { durationSec, avgRssi, avgPer };
}

export function buildSeries(rows: CsvRow[], limit = 2000) {
  // Group by device id and cap points for rendering
  const map = new Map<number, { deviceId: number; tag?: string; points: { t: number; rssi: number; per: number }[] }>();
  for (const r of rows) {
    const g = map.get(r.deviceId) ?? { deviceId: r.deviceId, tag: r.tag, points: [] };
    g.tag = r.tag ?? g.tag;
    g.points.push({ t: r.ts, rssi: r.rssi, per: r.per });
    map.set(r.deviceId, g);
  }
  const series = Array.from(map.values()).map((s) => {
    if (s.points.length > limit) s.points = s.points.slice(-limit);
    return s;
  });
  return series;
}
