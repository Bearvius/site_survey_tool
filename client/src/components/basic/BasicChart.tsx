import React, { useMemo } from 'react';

type DeviceSeries = {
  id: number;
  tag?: string;
  points: { t: number; rssi: number; per: number }[];
};

// A minimal, dependency-free SVG chart with two stacked panels (RSSI and PER)
// Used as a compatibility fallback on browsers where Recharts fails to load.
export default function BasicChart({ series, markers }: { series: DeviceSeries[]; markers?: number[] }) {
  const width = 800; // will scale via viewBox in parent container
  const height = 320;
  const panelGap = 12;
  const panelHeight = (height - panelGap) / 2;

  const { xMin, xMax, rssiPaths, perPaths, markerXs } = useMemo(() => {
    const allTs: number[] = [];
    for (const s of series) for (const p of s.points) if (Number.isFinite(p.t)) allTs.push(p.t);
    if (allTs.length === 0) {
      return { xMin: 0, xMax: 1, rssiPaths: [] as string[], perPaths: [] as string[], markerXs: [] as number[] };
    }
    const mn = Math.min(...allTs);
    const mx = Math.max(...allTs);
    const pad = Math.max(1, Math.floor((mx - mn) * 0.05));
    const xMin = mn === mx ? mn - 1000 : mn - pad;
    const xMax = mn === mx ? mx + 1000 : mx + pad;
    const sx = (t: number) => ((t - xMin) / (xMax - xMin)) * width;

    const syRssi = (v: number) => {
      const lo = -110, hi = 0; // dBm
      const py = (v - lo) / (hi - lo); // 0..1
      return panelHeight - py * panelHeight; // invert y
    };
    const syPer = (v: number) => {
      const lo = 0, hi = 100; // %
      const py = (v - lo) / (hi - lo);
      return panelHeight - py * panelHeight;
    };

    const buildPath = (pts: { t: number; v: number }[], sy: (v: number) => number) => {
      if (!pts.length) return '';
      const cmd: string[] = [];
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const x = sx(p.t);
        const y = sy(p.v);
        cmd.push(i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `L ${x.toFixed(1)} ${y.toFixed(1)}`);
      }
      return cmd.join(' ');
    };

    const rssiPaths: string[] = [];
    const perPaths: string[] = [];
    for (const s of series) {
      const rssiPts = s.points.map((p) => ({ t: p.t, v: p.rssi }));
      const perPts = s.points.map((p) => ({ t: p.t, v: p.per }));
      rssiPaths.push(buildPath(rssiPts, syRssi));
      perPaths.push(buildPath(perPts, syPer));
    }

    const markerXs = (markers || []).filter((m) => typeof m === 'number' && m >= xMin && m <= xMax).map(sx);
    return { xMin, xMax, rssiPaths, perPaths, markerXs };
  }, [series, markers]);

  if (rssiPaths.length === 0 && perPaths.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
        Waiting for data…
      </div>
    );
  }

  const colors = ['#3366cc', '#dc3912', '#109618', '#990099', '#0099c6', '#dd4477'];

  return (
    <div style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
        {/* RSSI panel */}
        <g transform={`translate(0,0)`}>
          <rect x={0} y={0} width={width} height={panelHeight} fill="#ffffff" stroke="#e5e7eb" />
          {rssiPaths.map((d, i) => d && <path key={`r${i}`} d={d} fill="none" stroke={colors[i % colors.length]} strokeWidth={1.5} />)}
          <text x={6} y={12} fontSize={10} fill="#475569">RSSI (dBm)</text>
        </g>
        {/* PER panel */}
        <g transform={`translate(0,${panelHeight + panelGap})`}>
          <rect x={0} y={0} width={width} height={panelHeight} fill="#ffffff" stroke="#e5e7eb" />
          {perPaths.map((d, i) => d && <path key={`p${i}`} d={d} fill="none" stroke={colors[i % colors.length]} strokeWidth={1.5} />)}
          <text x={6} y={12} fontSize={10} fill="#475569">PER (%)</text>
        </g>
        {/* Markers (span full chart height) */}
        {markerXs.map((x, i) => (
          <g key={`m${i}`}>
            <line x1={x} y1={0} x2={x} y2={height} stroke="#b8860b" strokeDasharray="4 4" />
            <text x={x + 2} y={10} fontSize={10} fill="#b8860b">S{i + 1}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
