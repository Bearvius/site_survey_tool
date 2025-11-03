import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib';
import ChartLive from '../components/ChartLive';
import GpsStatus from '../components/GpsStatus';
import ConfirmDialog from '../components/ConfirmDialog';
import { useNavigate, useSearchParams } from 'react-router-dom';

type LiveMsg = {
  timestamp: string;
  durationSec: number;
  devices: { id: number; tag?: string; rssi: number; per: number }[];
  gps?: { source: 'external' | 'mobile' | 'off'; fix: boolean; lat?: number; lon?: number };
  fault?: { gateway: boolean; message?: string };
  mode: 'spot' | 'continous';
  subIndex?: number;
  subLocation?: string;
};

export default function NewMeasurement() {
  const nav = useNavigate();
  const [search] = useSearchParams();
  const mode = (search.get('mode') as 'spot' | 'continous') || 'spot';
  const [location, setLocation] = useState('');
  const [live, setLive] = useState<LiveMsg | null>(null);
  const [thresholds, setThresholds] = useState<{ rssiGood: number; rssiWarn: number; perGood: number; perWarn: number }>({ rssiGood: -70, rssiWarn: -85, perGood: 2, perWarn: 5 });
  const bufferRef = useRef<Map<number, { id: number; tag?: string; points: { t: number; rssi: number; per: number }[] }>>(new Map());
  const [paused, setPaused] = useState(false);
  const [confirm, setConfirm] = useState<null | { action: 'stop' | 'cancel'; text: string }>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const canControl = location.trim().length > 0;
  const [subLocText, setSubLocText] = useState('');
  const prevSubIndexRef = useRef<number | undefined>(undefined);
  const markersRef = useRef<number[]>([]);

  const startedRef = useRef(false);
  useEffect(() => {
    // start measurement on mount
    if (startedRef.current) return;
    startedRef.current = true;
    api.post('/measurements/start', { location: location || 'Unnamed', type: mode }).catch(() => {});
    // load thresholds from settings
    api.get('/settings').then((r) => {
      const t = r.data?.thresholds;
      if (t) setThresholds(t);
    }).catch(() => {});
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${window.location.host}/ws/live`);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        setLive(msg);
      } catch {}
    };
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
    if (!live) return;
    const now = Date.now();
    // Detect sub-location changes for continous mode and add markers
    if (mode === 'continous') {
      const prev = prevSubIndexRef.current;
      if (typeof live.subIndex === 'number' && live.subIndex !== prev) {
        // push a marker at current time to align with our local point timestamps
        markersRef.current.push(now);
        prevSubIndexRef.current = live.subIndex;
        // Sync sub-location text from server when index changes
        if (typeof live.subLocation === 'string') setSubLocText(live.subLocation);
      }
    }
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
      if (location.trim()) api.post('/measurements/location', { location }).catch(() => {});
    }, 400);
    return () => clearTimeout(h);
  }, [location]);

  // Mobile GPS: if mode is mobile, try to send coordinates via geolocation
  useEffect(() => {
    let watchId: number | null = null;
    if (live?.gps?.source === 'mobile' && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition((pos) => {
        api.post('/gps/mobile', { lat: pos.coords.latitude, lon: pos.coords.longitude }).catch(() => {});
      });
    }
    return () => {
      if (watchId && navigator.geolocation) navigator.geolocation.clearWatch(watchId);
    };
  }, [live?.gps?.source]);

  async function onPause() {
    if (!canControl) return;
    if (!paused) await api.post('/measurements/pause');
    else await api.post('/measurements/resume');
    setPaused(!paused);
  }
  async function onStop() {
    if (!canControl) return;
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

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <div><b>Mode:</b> {mode === 'continous' ? 'Continous Measurement' : 'Spot Measurement'}</div>
        {mode === 'continous' && (
          <div style={{ color: '#6b7280' }}>(Survey by moving; mark sub-locations as you go)</div>
        )}
      </div>
      <label>
        Location
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Enter location" style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }} />
      </label>
      {mode === 'continous' && (
        <div className="card" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontWeight: 600 }}>Sub-location</div>
          <input value={subLocText} onChange={(e)=>setSubLocText(e.target.value)} placeholder="e.g. Aisle 3, Bay 2" style={{ flex: 1, minWidth: 200 }} />
          <button className="btn" onClick={() => { api.post('/measurements/sub-location', { subLocation: subLocText }).catch(()=>{}); }}>Update</button>
          <div style={{ marginLeft: 'auto', color: '#555' }}>Index: {live?.subIndex ?? 0}</div>
        </div>
      )}
      <div>Timestamp: {new Date().toLocaleString()}</div>
      <div>Duration: {durationText}</div>
      {live?.fault?.gateway && (
        <div className="card" style={{ borderColor: '#b8860b', background: '#fff8e1' }}>
          <div style={{ fontWeight: 700, color: '#b8860b' }}>Gateway communication fault</div>
          <div style={{ color: '#6b7280' }}>{live.fault.message || 'No data received from wireless gateway.'}</div>
        </div>
      )}
      <div className="card">
        <ChartLive series={series} markers={mode === 'continous' ? markersRef.current : undefined} />
      </div>
      {live?.gps?.source === 'mobile' && (
        <div style={{ padding: 10, border: '1px dashed #bbb', borderRadius: 6 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Mobile GPS mode active</div>
          <div style={{ marginBottom: 6 }}>
            If location isn’t updating on this device, open this URL on your phone to send GPS to the server while the measurement runs:
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <a href={mobileGpsUrl} target="_blank" rel="noreferrer">{mobileGpsUrl}</a>
            <button onClick={() => navigator.clipboard?.writeText(mobileGpsUrl)}>Copy link</button>
          </div>
          <div style={{ marginTop: 6, color: '#555' }}>Tip: Many browsers require HTTPS for geolocation (except localhost).</div>
        </div>
      )}
      {/* Per-device indicators for latest RSSI and PER */}
      <div className="card">
        <h4 style={{ marginTop: 0 }}>Live device values</h4>
        <div className="tiles">
          {(live?.devices ?? []).sort((a, b) => a.id - b.id).map((d) => {
            const rssi = Math.round(d.rssi);
            const per = Math.round(d.per);
            const rssiColor = rssi >= thresholds.rssiGood ? '#1a7f37' : rssi >= thresholds.rssiWarn ? '#b8860b' : '#b22222';
            const perColor = per <= thresholds.perGood ? '#1a7f37' : per <= thresholds.perWarn ? '#b8860b' : '#b22222';
            return (
              <div key={d.id} className="tile">
                <div className="title">D{d.id}{d.tag ? ` • ${d.tag}` : ''}</div>
                <div style={{ color: rssiColor }}>RSSI: {rssi} dBm</div>
                <div style={{ color: perColor }}>PER: {per}%</div>
              </div>
            );
          })}
        </div>
      </div>
      <GpsStatus source={live?.gps?.source ?? 'off'} fix={live?.gps?.fix} lat={live?.gps?.lat} lon={live?.gps?.lon} />
      <div className="flex gap-8 justify-between">
        <button className="btn" onClick={onPause} disabled={!canControl}>
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button className="btn btn-primary" onClick={() => canControl && setConfirm({ action: 'stop', text: 'Stop and save measurement?' })} disabled={!canControl}>Stop</button>
        <button className="btn btn-danger" onClick={() => setConfirm({ action: 'cancel', text: 'Cancel measurement without saving?' })}>Cancel</button>
      </div>
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.action === 'stop' ? 'Confirm Stop' : 'Confirm Cancel'}
        message={confirm?.text ?? ''}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const a = confirm?.action;
          setConfirm(null);
          if (a === 'stop') onStop(); else onCancel();
        }}
      />
    </div>
  );
}
