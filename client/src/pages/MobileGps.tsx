import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib';

export default function MobileGps() {
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation API not available on this device/browser.');
      return;
    }

    // Many browsers require HTTPS (secure context) for geolocation except on localhost.
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    if (!isSecure) {
      setStatus('Warning: This page is not served over HTTPS. Some devices/browsers will block location access.');
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setCoords({ lat, lon });
        setError('');
        setStatus('Sending location…');
        api.post('/gps/mobile', { lat, lon })
          .then(() => setStatus('Location sent'))
          .catch((e) => setError(`Failed to send: ${e?.message || 'Unknown error'}`));
      },
      (err) => {
        setError(err?.message || 'Failed to get location');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000,
      }
    );

    return () => {
      if (watchIdRef.current && navigator.geolocation) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h2>Mobile GPS Companion</h2>
      <p>This page continuously shares your device location with the Site Survey server while a measurement is running.</n+></p>
      <ul>
        <li>Keep this page open during the measurement.</li>
        <li>Grant location permission when prompted.</li>
        <li>For best compatibility, use HTTPS when accessing this page.</li>
      </ul>
      {status && <div style={{ color: '#555', marginTop: 8 }}>{status}</div>}
      {error && <div style={{ color: '#b22222', marginTop: 8 }}>{error}</div>}
      <div style={{ marginTop: 12 }}>
        <div>Current device: {navigator.userAgent}</div>
        <div>Page URL: {window.location.href}</div>
      </div>
      <div style={{ marginTop: 12 }}>
        {coords ? (
          <div>
            <div>Lat: {coords.lat.toFixed(6)}</div>
            <div>Lon: {coords.lon.toFixed(6)}</div>
          </div>
        ) : (
          <div>Waiting for GPS fix…</div>
        )}
      </div>
    </div>
  );
}
