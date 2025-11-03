import React from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import dayjs from 'dayjs';

type DeviceSeries = {
  id: number;
  tag?: string;
  points: { t: number; rssi: number; per: number }[];
};

export default function ChartLive({ series, markers }: { series: DeviceSeries[]; markers?: number[] }) {
  const dataLen = Math.max(0, ...series.map((s) => s.points.length));
  const data = Array.from({ length: dataLen }).map((_, idx) => {
    const row: any = { idx };
    let t: number | undefined;
    for (const s of series) {
      const p = s.points[idx];
      if (p) {
        row[`rssi${s.id}`] = p.rssi;
        row[`per${s.id}`] = p.per;
        if (t === undefined) t = p.t;
      }
    }
    row.time = t ? dayjs(t).format('HH:mm:ss') : '';
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
        <CartesianGrid stroke="#eee" />
  <XAxis dataKey="time" />
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
        {markers && markers.map((ts, i) => (
          <ReferenceLine key={`m-${i}`} x={dayjs(ts).format('HH:mm:ss')} stroke="#b8860b" strokeDasharray="4 4" label={{ value: `S${i+1}`, position: 'top', fill: '#b8860b', fontSize: 10 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
