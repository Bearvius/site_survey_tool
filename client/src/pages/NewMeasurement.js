import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib';
import ChartLive from '../components/ChartLive';
import GpsStatus from '../components/GpsStatus';
import ConfirmDialog from '../components/ConfirmDialog';
import { useNavigate, useSearchParams } from 'react-router-dom';
export default function NewMeasurement() {
    const nav = useNavigate();
    const [search] = useSearchParams();
    const mode = search.get('mode') || 'spot';
    const [location, setLocation] = useState('');
    const [live, setLive] = useState(null);
    const [thresholds, setThresholds] = useState({ rssiGood: -70, rssiWarn: -85, perGood: 2, perWarn: 5 });
    const bufferRef = useRef(new Map());
    const [paused, setPaused] = useState(false);
    const [confirm, setConfirm] = useState(null);
    const wsRef = useRef(null);
    const canControl = location.trim().length > 0;
    const [subLocText, setSubLocText] = useState('');
    useEffect(() => {
        // start measurement on mount
        api.post('/measurements/start', { location: location || 'Unnamed', type: mode }).catch(() => { });
        // load thresholds from settings
        api.get('/settings').then((r) => {
            const t = r.data?.thresholds;
            if (t)
                setThresholds(t);
        }).catch(() => { });
        const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const ws = new WebSocket(`${proto}://${window.location.host}/ws/live`);
        ws.onmessage = (ev) => setLive(JSON.parse(ev.data));
        wsRef.current = ws;
        return () => {
            ws.close();
        };
    }, []);
    const series = useMemo(() => {
        // derive current series snapshot from buffer
        return Array.from(bufferRef.current.values()).map((v) => ({ id: v.id, tag: v.tag, points: v.points }));
    }, [live]);
    useEffect(() => {
        if (!live)
            return;
        const now = Date.now();
        for (const d of live.devices) {
            const entry = bufferRef.current.get(d.id) ?? { id: d.id, tag: d.tag, points: [] };
            entry.tag = d.tag;
            entry.points.push({ t: now, rssi: d.rssi, per: d.per });
            // Keep all points since measurement start (no trimming)
            bufferRef.current.set(d.id, entry);
        }
    }, [live]);
    // If user types location after start, sync to backend
    useEffect(() => {
        const h = setTimeout(() => {
            if (location.trim())
                api.post('/measurements/location', { location }).catch(() => { });
        }, 400);
        return () => clearTimeout(h);
    }, [location]);
    // Mobile GPS: if mode is mobile, try to send coordinates via geolocation
    useEffect(() => {
        let watchId = null;
        if (live?.gps?.source === 'mobile' && navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition((pos) => {
                api.post('/gps/mobile', { lat: pos.coords.latitude, lon: pos.coords.longitude }).catch(() => { });
            });
        }
        return () => {
            if (watchId && navigator.geolocation)
                navigator.geolocation.clearWatch(watchId);
        };
    }, [live?.gps?.source]);
    async function onPause() {
        if (!canControl)
            return;
        if (!paused)
            await api.post('/measurements/pause');
        else
            await api.post('/measurements/resume');
        setPaused(!paused);
    }
    async function onStop() {
        if (!canControl)
            return;
        const { data } = await api.post('/measurements/stop');
        alert(`Saved ${data.file}`);
        nav('/measurements');
    }
    async function onCancel() {
        await api.post('/measurements/cancel');
        nav('/measurements');
    }
    const durationText = live ? (live.durationSec < 60 ? `${live.durationSec}s` : `${Math.floor(live.durationSec / 60)}m`) : '0s';
    const mobileGpsUrl = `${window.location.protocol}//${window.location.host}/mobile-gps`;
    return (_jsxs("div", { style: { display: 'grid', gap: 12 }, children: [_jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }, children: [_jsxs("div", { children: [_jsx("b", { children: "Mode:" }), " ", mode === 'continous' ? 'Continous Measurement' : 'Spot Measurement'] }), mode === 'continous' && (_jsx("div", { style: { color: '#6b7280' }, children: "(Survey by moving; mark sub-locations as you go)" }))] }), _jsxs("label", { children: ["Location", _jsx("input", { value: location, onChange: (e) => setLocation(e.target.value), placeholder: "Enter location", style: { display: 'block', width: '100%', padding: 8, marginTop: 4 } })] }), mode === 'continous' && (_jsxs("div", { className: "card", style: { display: 'flex', gap: 8, alignItems: 'center' }, children: [_jsx("div", { style: { fontWeight: 600 }, children: "Sub-location" }), _jsx("input", { value: subLocText, onChange: (e) => setSubLocText(e.target.value), placeholder: "e.g. Aisle 3, Bay 2", style: { flex: 1, minWidth: 200 } }), _jsx("button", { className: "btn", onClick: () => { api.post('/measurements/sub-location', { subLocation: subLocText }).catch(() => { }); setSubLocText(''); }, children: "Update" }), _jsxs("div", { style: { marginLeft: 'auto', color: '#555' }, children: ["Index: ", live?.subIndex ?? 0] })] })), _jsxs("div", { children: ["Timestamp: ", new Date().toLocaleString()] }), _jsxs("div", { children: ["Duration: ", durationText] }), live?.fault?.gateway && (_jsxs("div", { className: "card", style: { borderColor: '#b8860b', background: '#fff8e1' }, children: [_jsx("div", { style: { fontWeight: 700, color: '#b8860b' }, children: "Gateway communication fault" }), _jsx("div", { style: { color: '#6b7280' }, children: live.fault.message || 'No data received from wireless gateway.' })] })), _jsx("div", { className: "card", children: _jsx(ChartLive, { series: series }) }), live?.gps?.source === 'mobile' && (_jsxs("div", { style: { padding: 10, border: '1px dashed #bbb', borderRadius: 6 }, children: [_jsx("div", { style: { fontWeight: 600, marginBottom: 6 }, children: "Mobile GPS mode active" }), _jsx("div", { style: { marginBottom: 6 }, children: "If location isn\u2019t updating on this device, open this URL on your phone to send GPS to the server while the measurement runs:" }), _jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }, children: [_jsx("a", { href: mobileGpsUrl, target: "_blank", rel: "noreferrer", children: mobileGpsUrl }), _jsx("button", { onClick: () => navigator.clipboard?.writeText(mobileGpsUrl), children: "Copy link" })] }), _jsx("div", { style: { marginTop: 6, color: '#555' }, children: "Tip: Many browsers require HTTPS for geolocation (except localhost)." })] })), _jsxs("div", { className: "card", children: [_jsx("h4", { style: { marginTop: 0 }, children: "Live device values" }), _jsx("div", { className: "tiles", children: (live?.devices ?? []).sort((a, b) => a.id - b.id).map((d) => {
                            const rssi = Math.round(d.rssi);
                            const per = Math.round(d.per);
                            const rssiColor = rssi >= thresholds.rssiGood ? '#1a7f37' : rssi >= thresholds.rssiWarn ? '#b8860b' : '#b22222';
                            const perColor = per <= thresholds.perGood ? '#1a7f37' : per <= thresholds.perWarn ? '#b8860b' : '#b22222';
                            return (_jsxs("div", { className: "tile", children: [_jsxs("div", { className: "title", children: ["D", d.id, d.tag ? ` • ${d.tag}` : ''] }), _jsxs("div", { style: { color: rssiColor }, children: ["RSSI: ", rssi, " dBm"] }), _jsxs("div", { style: { color: perColor }, children: ["PER: ", per, "%"] })] }, d.id));
                        }) })] }), _jsx(GpsStatus, { source: live?.gps?.source ?? 'off', fix: live?.gps?.fix, lat: live?.gps?.lat, lon: live?.gps?.lon }), _jsxs("div", { className: "flex gap-8 justify-between", children: [_jsx("button", { className: "btn", onClick: onPause, disabled: !canControl, children: paused ? 'Resume' : 'Pause' }), _jsx("button", { className: "btn btn-primary", onClick: () => canControl && setConfirm({ action: 'stop', text: 'Stop and save measurement?' }), disabled: !canControl, children: "Stop" }), _jsx("button", { className: "btn btn-danger", onClick: () => setConfirm({ action: 'cancel', text: 'Cancel measurement without saving?' }), children: "Cancel" })] }), _jsx(ConfirmDialog, { open: !!confirm, title: confirm?.action === 'stop' ? 'Confirm Stop' : 'Confirm Cancel', message: confirm?.text ?? '', onCancel: () => setConfirm(null), onConfirm: () => {
                    const a = confirm?.action;
                    setConfirm(null);
                    if (a === 'stop')
                        onStop();
                    else
                        onCancel();
                } })] }));
}
