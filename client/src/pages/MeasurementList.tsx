import React, { useEffect, useMemo, useState } from 'react';
import { api, fmtDuration } from '../lib';
import ChartLive from '../components/ChartLive';
import ConfirmDialog from '../components/ConfirmDialog';
import { useNavigate } from 'react-router-dom';

type Item = { number: number; id: string; name: string; timestamp: string; filename: string; durationSec: number; avgRssi: number; avgPer: number; type?: 'spot' | 'continous' };

export default function MeasurementList() {
  const nav = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [view, setView] = useState<Item | null>(null);
  const [confirm, setConfirm] = useState<Item | null>(null);
  const [details, setDetails] = useState<any | null>(null);
  const [thresholds, setThresholds] = useState<{ rssiGood: number; rssiWarn: number; perGood: number; perWarn: number }>({ rssiGood: -70, rssiWarn: -85, perGood: 2, perWarn: 5 });

  async function load() {
    const { data } = await api.get<Item[]>('/measurements');
    setItems(data);
  }
  useEffect(() => { load(); }, []);
  useEffect(() => { api.get('/settings').then((r) => r.data?.thresholds && setThresholds(r.data.thresholds)).catch(() => {}); }, []);

  async function onDelete(i: Item) {
    try {
      await api.delete(`/measurements/${encodeURIComponent(i.filename)}`);
      setConfirm(null);
      load();
    } catch (e: any) {
      alert(`Failed to delete ${i.filename}: ${e?.response?.data?.error || e.message || 'Unknown error'}`);
    }
  }

  return (
    <div>
      {items.length === 0 ? (
        <div>No measurements found</div>
      ) : (
        <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Timestamp</th>
              <th>Duration</th>
              <th>Avg RSSI</th>
              <th>Avg PER</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>{i.number}</td>
                <td>{i.name}</td>
                <td>{i.timestamp}</td>
                <td>{fmtDuration(i.durationSec)}</td>
                <td>{i.avgRssi} dBm</td>
                <td>{i.avgPer}%</td>
                <td>{i.type ?? (i.filename.includes('_continous') ? 'continous' : 'spot')}</td>
                <td>
                  <button className="btn" onClick={() => { setView(i); setDetails(null); api.get(`/measurements/${i.filename}/details`).then((r) => setDetails(r.data)); }}>View</button>{' '}
                  <button className="btn btn-danger" onClick={() => setConfirm(i)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        <a href="#/new"><button className="btn btn-primary" onClick={() => (window.location.href = '/new')}>New Measurement</button></a>
        <button className="btn" style={{ marginLeft: 8 }} onClick={() => nav('/')}>Back</button>
      </div>
      {view && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center' }}>
          <div style={{ background: 'white', padding: 16, borderRadius: 8, maxWidth: 800, width: '90%' }}>
            <h3>{view.name} <small style={{ color: '#6b7280', fontWeight: 400 }}>({view.type ?? (view.filename.includes('_continous') ? 'continous' : 'spot')})</small></h3>
            <p>File: {view.filename}</p>
            {details ? (
              <>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div>Duration: {fmtDuration(details.stats.durationSec)}</div>
                  <div>Avg RSSI: {details.stats.avgRssi} dBm</div>
                  <div>Avg PER: {details.stats.avgPer}%</div>
                </div>
                {/* Per-device average indicators with colors */}
                <div style={{ marginTop: 8 }}>
                  <h4>Per-device averages</h4>
                  <div className="tiles">
                    {details.series.map((s: any) => {
                      // compute averages for this device
                      const avgRssi = Math.round((s.points.reduce((acc: number, p: any) => acc + p.rssi, 0) / Math.max(1, s.points.length)));
                      const avgPer = Math.round((s.points.reduce((acc: number, p: any) => acc + p.per, 0) / Math.max(1, s.points.length)));
                      const rssiColor = avgRssi >= thresholds.rssiGood ? '#1a7f37' : avgRssi >= thresholds.rssiWarn ? '#b8860b' : '#b22222';
                      const perColor = avgPer <= thresholds.perGood ? '#1a7f37' : avgPer <= thresholds.perWarn ? '#b8860b' : '#b22222';
                      return (
                        <div key={s.deviceId} className="tile">
                          <div className="title">D{s.deviceId}{s.tag ? ` • ${s.tag}` : ''}</div>
                          <div style={{ color: rssiColor }}>Avg RSSI: {avgRssi} dBm</div>
                          <div style={{ color: perColor }}>Avg PER: {avgPer}%</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <ChartLive series={details.series.map((s: any) => ({ id: s.deviceId, tag: s.tag, points: s.points }))} markers={details.markers?.map((m: any) => m.ts)} />
                </div>
                {details.perSub && (
                  <div style={{ marginTop: 12 }}>
                    <h4>Average per sub-location</h4>
                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Index</th>
                            <th>Sub-location</th>
                            <th>Avg RSSI</th>
                            <th>Avg PER</th>
                            <th>Samples</th>
                          </tr>
                        </thead>
                        <tbody>
                          {details.perSub.map((row: any) => (
                            <tr key={row.subIndex}>
                              <td>{row.subIndex}</td>
                              <td>{row.subLocation || ''}</td>
                              <td>{row.avgRssi} dBm</td>
                              <td>{row.avgPer}%</td>
                              <td>{row.samples}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {details.perSubDevice && (
                  <div style={{ marginTop: 12 }}>
                    <h4>Per-device averages per sub-location</h4>
                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Index</th>
                            <th>Sub-location</th>
                            <th>Device</th>
                            <th>Tag</th>
                            <th>Avg RSSI</th>
                            <th>Avg PER</th>
                            <th>Samples</th>
                          </tr>
                        </thead>
                        <tbody>
                          {details.perSubDevice.map((row: any) => (
                            <tr key={`${row.subIndex}-${row.deviceId}`}>
                              <td>{row.subIndex}</td>
                              <td>{row.subLocation || ''}</td>
                              <td>D{row.deviceId}</td>
                              <td>{row.tag || ''}</td>
                              <td>{row.avgRssi} dBm</td>
                              <td>{row.avgPer}%</td>
                              <td>{row.samples}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div>Loading…</div>
            )}
            <a href={`/api/measurements/${view.filename}`} target="_blank">Download CSV</a>
            <div style={{ marginTop: 8, textAlign: 'right' }}>
              <button className="btn" onClick={() => { setView(null); setDetails(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={!!confirm}
        title="Confirm Delete"
        message={confirm ? `Delete ${confirm.filename}?` : ''}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && onDelete(confirm)}
      />
    </div>
  );
}
