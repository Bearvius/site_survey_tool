import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib';
import ChartLive from '../components/ChartLive';
import GpsStatus from '../components/GpsStatus';
import ConfirmDialog from '../components/ConfirmDialog';
import { useNavigate } from 'react-router-dom';
export default function NewMeasurement() {
    const nav = useNavigate();
    const [location, setLocation] = useState('');
    const [live, setLive] = useState(null);
    const [thresholds, setThresholds] = useState({ rssiGood: -70, rssiWarn: -85, perGood: 2, perWarn: 5 });
    const bufferRef = useRef(new Map());
    const [paused, setPaused] = useState(false);
    const [confirm, setConfirm] = useState(null);
    const wsRef = useRef(null);
    const canControl = location.trim().length > 0;
    useEffect(() => {
        // start measurement on mount
        api.post('/measurements/start', { location: location || 'Unnamed' }).catch(() => { });
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
    return (_jsxs("div", { style: { display: 'grid', gap: 12 }, children: [_jsxs("label", { children: ["Location", _jsx("input", { value: location, onChange: (e) => setLocation(e.target.value), placeholder: "Enter location", style: { display: 'block', width: '100%', padding: 8, marginTop: 4 } })] }), _jsxs("div", { children: ["Timestamp: ", new Date().toLocaleString()] }), _jsxs("div", { children: ["Duration: ", durationText] }), _jsx("div", { children: _jsx(ChartLive, { series: series }) }), _jsxs("div", { children: [_jsx("h4", { children: "Live device values" }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 8 }, children: (live?.devices ?? []).sort((a, b) => a.id - b.id).map((d) => {
                            const rssi = Math.round(d.rssi);
                            const per = Math.round(d.per);
                            const rssiColor = rssi >= thresholds.rssiGood ? '#1a7f37' : rssi >= thresholds.rssiWarn ? '#b8860b' : '#b22222';
                            const perColor = per <= thresholds.perGood ? '#1a7f37' : per <= thresholds.perWarn ? '#b8860b' : '#b22222';
                            return (_jsxs("div", { style: { border: '1px solid #ddd', borderRadius: 6, padding: '8px 10px', minWidth: 160 }, children: [_jsxs("div", { style: { fontWeight: 600 }, children: ["D", d.id, d.tag ? ` • ${d.tag}` : ''] }), _jsxs("div", { style: { color: rssiColor }, children: ["RSSI: ", rssi, " dBm"] }), _jsxs("div", { style: { color: perColor }, children: ["PER: ", per, "%"] })] }, d.id));
                        }) })] }), _jsx(GpsStatus, { source: live?.gps?.source ?? 'off', fix: live?.gps?.fix, lat: live?.gps?.lat, lon: live?.gps?.lon }), _jsxs("div", { style: { display: 'flex', gap: 8, justifyContent: 'space-between' }, children: [_jsx("button", { onClick: onPause, disabled: !canControl, children: paused ? 'Resume' : 'Pause' }), _jsx("button", { onClick: () => canControl && setConfirm({ action: 'stop', text: 'Stop and save measurement?' }), disabled: !canControl, children: "Stop" }), _jsx("button", { onClick: () => setConfirm({ action: 'cancel', text: 'Cancel measurement without saving?' }), children: "Cancel" })] }), _jsx(ConfirmDialog, { open: !!confirm, title: confirm?.action === 'stop' ? 'Confirm Stop' : 'Confirm Cancel', message: confirm?.text ?? '', onCancel: () => setConfirm(null), onConfirm: () => {
                    const a = confirm?.action;
                    setConfirm(null);
                    if (a === 'stop')
                        onStop();
                    else
                        onCancel();
                } })] }));
}
