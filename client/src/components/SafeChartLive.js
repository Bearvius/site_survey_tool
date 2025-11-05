import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import BasicChart from './basic/BasicChart';
// Dynamically import Recharts-based ChartLive; if it fails on older browsers,
// fall back to a lightweight SVG chart that avoids problematic polyfills.
export default function SafeChartLive(props) {
    const ChartRef = useRef(null);
    const [mode, setMode] = useState('loading');
    useEffect(() => {
        let active = true;
        import('./ChartLive')
            .then((mod) => {
            if (!active)
                return;
            ChartRef.current = mod.default || mod;
            setMode('recharts');
        })
            .catch((err) => {
            console.warn('ChartLive import failed, using basic chart fallback', err);
            if (!active)
                return;
            setMode('basic');
        });
        return () => { active = false; };
    }, []);
    if (mode === 'loading')
        return _jsx("div", { children: "Loading chart\u2026" });
    if (mode === 'recharts' && ChartRef.current) {
        const C = ChartRef.current;
        return _jsx(C, { ...props });
    }
    return (_jsxs("div", { children: [_jsx("div", { style: { padding: 6, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 6, color: '#475569', marginBottom: 8 }, children: "Compatibility mode: simplified chart rendering." }), _jsx(BasicChart, { ...props })] }));
}
