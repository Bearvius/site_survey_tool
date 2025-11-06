import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { api, fmtDuration } from '../lib';
import SafeChartLive from '../components/SafeChartLive';
import ConfirmDialog from '../components/ConfirmDialog';
import { useNavigate } from 'react-router-dom';
export default function MeasurementList() {
    const nav = useNavigate();
    const [items, setItems] = useState([]);
    const [view, setView] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [details, setDetails] = useState(null);
    const [thresholds, setThresholds] = useState({ rssiGood: -70, rssiWarn: -85, perGood: 2, perWarn: 5 });
    async function load() {
        const { data } = await api.get('/measurements');
        setItems(data);
    }
    useEffect(() => { load(); }, []);
    useEffect(() => { api.get('/settings').then((r) => r.data?.thresholds && setThresholds(r.data.thresholds)).catch(() => { }); }, []);
    async function onDelete(i) {
        try {
            await api.delete(`/measurements/${encodeURIComponent(i.filename)}`);
            setConfirm(null);
            load();
        }
        catch (e) {
            alert(`Failed to delete ${i.filename}: ${e?.response?.data?.error || e.message || 'Unknown error'}`);
        }
    }
    // Sort ascending by timestamp for display
    const sorted = [...items].sort((a, b) => (new Date(a.timestamp)).getTime() - (new Date(b.timestamp)).getTime());
    // Helper to format ts as "hh:mm:ss dd-mmm-yyyy" (month in lowercase)
    function fmtTs(ts) {
        const d = dayjs(ts);
        if (!d.isValid())
            return ts;
        const time = d.format('HH:mm:ss');
        const day = d.format('DD');
        const mon = d.format('MMM').toLowerCase();
        const year = d.format('YYYY');
        return `${time} ${day}-${mon}-${year}`;
    }
    return (_jsxs("div", { children: [sorted.length === 0 ? (_jsx("div", { children: "No measurements found" })) : (_jsx("div", { className: "table-container", children: _jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "#" }), _jsx("th", { children: "Name" }), _jsx("th", { children: "Timestamp" }), _jsx("th", { children: "Duration" }), _jsx("th", { children: "Avg RSSI" }), _jsx("th", { children: "Avg PER" }), _jsx("th", { children: "Type" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: sorted.map((i) => (_jsxs("tr", { children: [_jsx("td", { children: i.number }), _jsx("td", { children: i.name }), _jsx("td", { children: fmtTs(i.timestamp) }), _jsx("td", { children: fmtDuration(i.durationSec) }), _jsxs("td", { children: [i.avgRssi, " dBm"] }), _jsxs("td", { children: [i.avgPer, "%"] }), _jsx("td", { children: i.type ?? (i.filename.includes('_continous') ? 'continous' : 'spot') }), _jsxs("td", { children: [_jsx("button", { className: "btn", onClick: () => { setView(i); setDetails(null); api.get(`/measurements/${i.filename}/details`).then((r) => setDetails(r.data)); }, children: "View" }), ' ', _jsx("button", { className: "btn btn-danger", onClick: () => setConfirm(i), children: "Delete" })] })] }, i.id))) })] }) })), _jsxs("div", { style: { marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }, children: [_jsx("button", { className: "btn btn-primary", onClick: () => nav('/new?mode=spot'), children: "New Spot Measurement" }), _jsx("button", { className: "btn", onClick: () => nav('/new?mode=continous'), children: "New Continous Measurement" }), _jsx("button", { className: "btn", onClick: () => nav('/'), children: "Back" })] }), view && (_jsx("div", { style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center' }, children: _jsxs("div", { style: { background: 'white', padding: 16, borderRadius: 8, maxWidth: 800, width: '90%' }, children: [_jsxs("h3", { children: [view.name, " ", _jsxs("small", { style: { color: '#6b7280', fontWeight: 400 }, children: ["(", view.type ?? (view.filename.includes('_continous') ? 'continous' : 'spot'), ")"] })] }), _jsxs("p", { children: ["File: ", view.filename] }), details ? (_jsxs(_Fragment, { children: [_jsxs("div", { style: { display: 'flex', gap: 16, flexWrap: 'wrap' }, children: [_jsxs("div", { children: ["Duration: ", fmtDuration(details.stats.durationSec)] }), _jsxs("div", { children: ["Avg RSSI: ", details.stats.avgRssi, " dBm"] }), _jsxs("div", { children: ["Avg PER: ", details.stats.avgPer, "%"] })] }), _jsxs("div", { style: { marginTop: 8 }, children: [_jsx("h4", { children: "Per-device averages" }), _jsx("div", { className: "tiles", children: details.series.map((s) => {
                                                // compute averages for this device
                                                const avgRssi = Math.round((s.points.reduce((acc, p) => acc + p.rssi, 0) / Math.max(1, s.points.length)));
                                                const avgPer = Math.round((s.points.reduce((acc, p) => acc + p.per, 0) / Math.max(1, s.points.length)));
                                                const rssiColor = avgRssi >= thresholds.rssiGood ? '#1a7f37' : avgRssi >= thresholds.rssiWarn ? '#b8860b' : '#b22222';
                                                const perColor = avgPer <= thresholds.perGood ? '#1a7f37' : '#b22222';
                                                return (_jsxs("div", { className: "tile", children: [_jsxs("div", { className: "title", children: ["D", s.deviceId, s.tag ? ` • ${s.tag}` : ''] }), _jsxs("div", { style: { color: rssiColor }, children: ["Avg RSSI: ", avgRssi, " dBm"] }), _jsxs("div", { style: { color: avgPer <= thresholds.perWarn ? perColor : '#b8860b' }, children: ["Avg PER: ", avgPer, "%"] })] }, s.deviceId));
                                            }) })] }), _jsx("div", { style: { marginTop: 8 }, children: _jsx(SafeChartLive, { series: details.series.map((s) => ({ id: s.deviceId, tag: s.tag, points: s.points })), markers: details.markers?.map((m) => m.ts) }) }), details.perSub && (_jsxs("div", { style: { marginTop: 12 }, children: [_jsx("h4", { children: "Average per sub-location" }), _jsx("div", { className: "table-container", children: _jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Index" }), _jsx("th", { children: "Sub-location" }), _jsx("th", { children: "Avg RSSI" }), _jsx("th", { children: "Avg PER" }), _jsx("th", { children: "Samples" })] }) }), _jsx("tbody", { children: details.perSub.map((row) => (_jsxs("tr", { children: [_jsx("td", { children: row.subIndex }), _jsx("td", { children: row.subLocation || '' }), _jsxs("td", { children: [row.avgRssi, " dBm"] }), _jsxs("td", { children: [row.avgPer, "%"] }), _jsx("td", { children: row.samples })] }, row.subIndex))) })] }) })] })), details.perSubDevice && (_jsxs("div", { style: { marginTop: 12 }, children: [_jsx("h4", { children: "Per-device averages per sub-location" }), _jsx("div", { className: "table-container", children: _jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Index" }), _jsx("th", { children: "Sub-location" }), _jsx("th", { children: "Device" }), _jsx("th", { children: "Tag" }), _jsx("th", { children: "Avg RSSI" }), _jsx("th", { children: "Avg PER" }), _jsx("th", { children: "Samples" })] }) }), _jsx("tbody", { children: details.perSubDevice.map((row) => (_jsxs("tr", { children: [_jsx("td", { children: row.subIndex }), _jsx("td", { children: row.subLocation || '' }), _jsxs("td", { children: ["D", row.deviceId] }), _jsx("td", { children: row.tag || '' }), _jsxs("td", { children: [row.avgRssi, " dBm"] }), _jsxs("td", { children: [row.avgPer, "%"] }), _jsx("td", { children: row.samples })] }, `${row.subIndex}-${row.deviceId}`))) })] }) })] }))] })) : (_jsx("div", { children: "Loading…" })), _jsx("a", { href: `/api/measurements/${view.filename}`, target: "_blank", children: "Download CSV" }), _jsx("div", { style: { marginTop: 8, textAlign: 'right' }, children: _jsx("button", { className: "btn", onClick: () => { setView(null); setDetails(null); }, children: "Close" }) })] }) })), _jsx(ConfirmDialog, { open: !!confirm, title: "Confirm Delete", message: confirm ? `Delete ${confirm.filename}?` : '', onCancel: () => setConfirm(null), onConfirm: () => confirm && onDelete(confirm) })] }));
}
