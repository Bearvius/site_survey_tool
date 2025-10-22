import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function GpsStatus({ source, fix, lat, lon }) {
    const label = source === 'external' ? 'External GPS Chip' : source === 'mobile' ? 'Mobile phone' : 'Off';
    return (_jsxs("div", { style: { fontSize: 14 }, children: [_jsx("b", { children: "GPS:" }), " ", label, " \u2014 ", fix ? 'Fix' : 'No Fix', " ", fix && lat && lon ? `(${lat.toFixed(5)}, ${lon.toFixed(5)})` : ''] }));
}
