import React from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import dayjs from 'dayjs';

type DeviceSeries = {
  id: number;
  tag?: string;
  points: { t: number; rssi: number; per: number }[];
};

export default function ChartLive({ series, markers }: { series: DeviceSeries[]; markers?: number[] }) {
  // Build rows based on the union of timestamps across all series to avoid index-based misalignment
  const tsSet = new Set<number>();
  for (const s of series) for (const p of s.points) if (Number.isFinite(p.t)) tsSet.add(p.t);
  const tsList = Array.from(tsSet.values()).sort((a, b) => a - b);
  const pointMaps = series.map((s) => {
    const m = new Map<number, { rssi: number; per: number }>();
    for (const p of s.points) m.set(p.t, { rssi: p.rssi, per: p.per });
    return { id: s.id, map: m };
  });
  const data = tsList.map((t, idx) => {
    const row: any = { idx, ts: t };
    for (const pm of pointMaps) {
      const v = pm.map.get(t);
      if (v) {
        row[`rssi${pm.id}`] = v.rssi;
        row[`per${pm.id}`] = v.per;
      }
    }
    return row;
  });

  const tsValues: number[] = data.map(d => d.ts).filter((v: any) => typeof v === 'number');
  const minTs = tsValues.length ? Math.min(...tsValues) : undefined;
  const maxTs = tsValues.length ? Math.max(...tsValues) : undefined;
  const markerTs: number[] = (markers || [])
    .filter(ts => typeof ts === 'number' && (minTs === undefined || ts >= minTs) && (maxTs === undefined || ts <= maxTs));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
        <CartesianGrid stroke="#eee" />
        <XAxis dataKey="ts" type="number" domain={[minTs ?? 'dataMin', maxTs ?? 'dataMax']} allowDataOverflow tickFormatter={(v) => (typeof v === 'number' ? dayjs(v).format('HH:mm:ss') : '')} />
        <YAxis yAxisId="rssi" domain={[-110, 0]} tickFormatter={(v) => `${v} dBm`} />
        <YAxis yAxisId="per" orientation="right" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <Tooltip />
        <Legend />
        {series.map((s) => (
          <Line
            key={`rssi-${s.id}`}
            yAxisId="rssi"
            type="monotone"
            dataKey={`rssi${s.id}`}
            name={`RSSI D${s.id}${s.tag ? ` (${s.tag})` : ''}`}
            stroke="#3366cc"
            dot={false}
            isAnimationActive={false}
            animationDuration={0}
          />
        ))}
        {series.map((s) => (
          <Line
            key={`per-${s.id}`}
            yAxisId="per"
            type="monotone"
            dataKey={`per${s.id}`}
            name={`PER D${s.id}${s.tag ? ` (${s.tag})` : ''}`}
            stroke="#dc3912"
            dot={false}
            isAnimationActive={false}
            animationDuration={0}
          />
        ))}
        {data.length > 0 && markerTs.map((ts, i) => (
          <ReferenceLine key={`m-${i}`} x={ts} stroke="#b8860b" strokeDasharray="4 4" label={{ value: `S${i + 1}`, position: 'top', fill: '#b8860b', fontSize: 10 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
