import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { api } from '../lib';
export default function MobileGps() {
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [coords, setCoords] = useState(null);
    const watchIdRef = useRef(null);
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
        watchIdRef.current = navigator.geolocation.watchPosition((pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            setCoords({ lat, lon });
            setError('');
            setStatus('Sending location…');
            api.post('/gps/mobile', { lat, lon })
                .then(() => setStatus('Location sent'))
                .catch((e) => setError(`Failed to send: ${e?.message || 'Unknown error'}`));
        }, (err) => {
            setError(err?.message || 'Failed to get location');
        }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 2000,
        });
        return () => {
            if (watchIdRef.current && navigator.geolocation)
                navigator.geolocation.clearWatch(watchIdRef.current);
        };
    }, []);
    return (_jsxs("div", { className: "card", style: { padding: 16 }, children: [_jsx("h2", { style: { marginTop: 0 }, children: "Mobile GPS Companion" }), _jsx("p", { children: "This page continuously shares your device location with the Site Survey server while a measurement is running." }), _jsxs("ul", { children: [_jsx("li", { children: "Keep this page open during the measurement." }), _jsx("li", { children: "Grant location permission when prompted." }), _jsx("li", { children: "For best compatibility, use HTTPS when accessing this page." })] }), status && _jsx("div", { className: "mt-8", style: { color: '#555' }, children: status }), error && _jsx("div", { className: "mt-8", style: { color: '#b22222' }, children: error }), _jsxs("div", { style: { marginTop: 12 }, children: [_jsxs("div", { children: ["Current device: ", navigator.userAgent] }), _jsxs("div", { children: ["Page URL: ", window.location.href] })] }), _jsx("div", { style: { marginTop: 12 }, children: coords ? (_jsxs("div", { children: [_jsxs("div", { children: ["Lat: ", coords.lat.toFixed(6)] }), _jsxs("div", { children: ["Lon: ", coords.lon.toFixed(6)] })] })) : (_jsx("div", { children: "Waiting for GPS fix\u2026" })) })] }));
}
