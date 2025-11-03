import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import dayjs from 'dayjs';
export default function ChartLive({ series, markers }) {
    const dataLen = Math.max(0, ...series.map((s) => s.points.length));
    const data = Array.from({ length: dataLen }).map((_, idx) => {
        const row = { idx };
        let t;
        for (const s of series) {
            const p = s.points[idx];
            if (p) {
                row[`rssi${s.id}`] = p.rssi;
                row[`per${s.id}`] = p.per;
                if (t === undefined)
                    t = p.t;
            }
        }
        row.time = t ? dayjs(t).format('HH:mm:ss') : '';
        return row;
    });
    return (_jsx(ResponsiveContainer, { width: "100%", height: 320, children: _jsxs(LineChart, { data: data, margin: { top: 10, right: 20, bottom: 10, left: 0 }, children: [_jsx(CartesianGrid, { stroke: "#eee" }), _jsx(XAxis, { dataKey: "time" }), _jsx(YAxis, { yAxisId: "rssi", domain: [-110, 0], tickFormatter: (v) => `${v} dBm` }), _jsx(YAxis, { yAxisId: "per", orientation: "right", domain: [0, 100], tickFormatter: (v) => `${v}%` }), _jsx(Tooltip, {}), _jsx(Legend, {}), series.map((s) => (_jsx(Line, { yAxisId: "rssi", type: "monotone", dataKey: `rssi${s.id}`, name: `RSSI D${s.id}${s.tag ? ` (${s.tag})` : ''}`, stroke: "#3366cc", dot: false, isAnimationActive: false, animationDuration: 0 }, `rssi-${s.id}`))), series.map((s) => (_jsx(Line, { yAxisId: "per", type: "monotone", dataKey: `per${s.id}`, name: `PER D${s.id}${s.tag ? ` (${s.tag})` : ''}`, stroke: "#dc3912", dot: false, isAnimationActive: false, animationDuration: 0 }, `per-${s.id}`))), markers && markers.map((ts, i) => (_jsx(ReferenceLine, { x: dayjs(ts).format('HH:mm:ss'), stroke: "#b8860b", strokeDasharray: "4 4", label: { value: `S${i + 1}`, position: 'top', fill: '#b8860b', fontSize: 10 } }, `m-${i}`)))] }) }));
}
