import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import dayjs from 'dayjs';
export default function ChartLive({ series, markers }) {
    // Build rows based on the union of timestamps across all series to avoid index-based misalignment
    const tsSet = new Set();
    for (const s of series)
        for (const p of s.points)
            if (Number.isFinite(p.t))
                tsSet.add(p.t);
    const tsList = Array.from(tsSet.values()).sort((a, b) => a - b);
    const pointMaps = series.map((s) => {
        const m = new Map();
        for (const p of s.points)
            m.set(p.t, { rssi: p.rssi, per: p.per });
        return { id: s.id, map: m };
    });
    const data = tsList.map((t, idx) => {
        const row = { idx, ts: t };
        for (const pm of pointMaps) {
            const v = pm.map.get(t);
            if (v) {
                row[`rssi${pm.id}`] = v.rssi;
                row[`per${pm.id}`] = v.per;
            }
        }
        return row;
    });
    const tsValues = data.map(d => d.ts).filter((v) => typeof v === 'number');
    const minTs = tsValues.length ? Math.min(...tsValues) : undefined;
    const maxTs = tsValues.length ? Math.max(...tsValues) : undefined;
    const hasData = typeof minTs === 'number' && typeof maxTs === 'number';
    // If there's no data yet, render a lightweight placeholder to avoid Recharts invariant errors
    if (!hasData) {
        return (_jsx("div", { style: { height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }, children: "Waiting for data\u2026" }));
    }
    // Avoid zero-width domains which can trigger invariant failures on some browsers
    const pad = Math.max(1, Math.floor((maxTs - minTs) * 0.05));
    const xMin = minTs === maxTs ? minTs - 1000 : (minTs - pad);
    const xMax = minTs === maxTs ? maxTs + 1000 : (maxTs + pad);
    const markerTs = (markers || [])
        .filter(ts => typeof ts === 'number' && ts >= xMin && ts <= xMax);
    return (_jsx(ResponsiveContainer, { width: "100%", height: 320, children: _jsxs(LineChart, { data: data, margin: { top: 10, right: 20, bottom: 10, left: 0 }, children: [_jsx(CartesianGrid, { stroke: "#eee" }), _jsx(XAxis, { dataKey: "ts", type: "number", domain: [xMin, xMax], allowDataOverflow: true, tickFormatter: (v) => (typeof v === 'number' ? dayjs(v).format('HH:mm:ss') : '') }), _jsx(YAxis, { yAxisId: "rssi", domain: [-110, 0], tickFormatter: (v) => `${v} dBm` }), _jsx(YAxis, { yAxisId: "per", orientation: "right", domain: [0, 100], tickFormatter: (v) => `${v}%` }), _jsx(Tooltip, {}), _jsx(Legend, {}), series.map((s) => (_jsx(Line, { yAxisId: "rssi", type: "monotone", dataKey: `rssi${s.id}`, name: `RSSI D${s.id}${s.tag ? ` (${s.tag})` : ''}`, stroke: "#3366cc", dot: false, isAnimationActive: false, animationDuration: 0 }, `rssi-${s.id}`))), series.map((s) => (_jsx(Line, { yAxisId: "per", type: "monotone", dataKey: `per${s.id}`, name: `PER D${s.id}${s.tag ? ` (${s.tag})` : ''}`, stroke: "#dc3912", dot: false, isAnimationActive: false, animationDuration: 0 }, `per-${s.id}`))), data.length > 0 && markerTs.map((ts, i) => (_jsx(ReferenceLine, { x: ts, stroke: "#b8860b", strokeDasharray: "4 4", label: { value: `S${i + 1}`, position: 'top', fill: '#b8860b', fontSize: 10 } }, `m-${i}`)))] }) }));
}
