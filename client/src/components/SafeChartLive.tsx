import React, { useEffect, useRef, useState } from 'react';
import BasicChart from './basic/BasicChart';

// Dynamically import Recharts-based ChartLive; if it fails on older browsers,
// fall back to a lightweight SVG chart that avoids problematic polyfills.
export default function SafeChartLive(props: any) {
  const ChartRef = useRef<null | React.ComponentType<any>>(null);
  const [mode, setMode] = useState<'loading' | 'recharts' | 'basic'>('loading');

  useEffect(() => {
    let active = true;
    import('./ChartLive')
      .then((mod) => {
        if (!active) return;
        ChartRef.current = (mod as any).default || (mod as any);
        setMode('recharts');
      })
      .catch((err) => {
        console.warn('ChartLive import failed, using basic chart fallback', err);
        if (!active) return;
        setMode('basic');
      });
    return () => { active = false; };
  }, []);

  if (mode === 'loading') return <div>Loading chart…</div>;
  if (mode === 'recharts' && ChartRef.current) {
    const C = ChartRef.current;
    return <C {...props} />;
  }
  return (
    <div>
      <div style={{ padding: 6, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 6, color: '#475569', marginBottom: 8 }}>
        Compatibility mode: simplified chart rendering.
      </div>
      <BasicChart {...props} />
    </div>
  );
}
