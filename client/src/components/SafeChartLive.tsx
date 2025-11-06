import React, { useEffect, useRef, useState } from 'react';
import BasicChart from './basic/BasicChart';

// Dynamically import the Recharts-based ChartLive. If the environment is incompatible
// (older Pi browser that throws on Symbol.toStringTag writes to built-ins), skip loading
// Recharts and render a lightweight SVG fallback instead.
export default function SafeChartLive(props: any) {
	const ChartRef = useRef<null | React.ComponentType<any>>(null);
	const [mode, setMode] = useState<'loading' | 'recharts' | 'basic'>('loading');

	useEffect(() => {
		let active = true;

		// Compatibility pre-check: detect read-only toStringTag on DataView/Set prototypes.
		try {
			const sym: any = (Symbol as any)?.toStringTag;
			if (typeof sym !== 'undefined') {
				if (typeof (DataView as any) !== 'undefined') {
					const dvDesc = Object.getOwnPropertyDescriptor((DataView as any).prototype, sym);
					if (dvDesc && dvDesc.writable === false) throw new Error('dv_toStringTag_readonly');
				}
				if (typeof (Set as any) !== 'undefined') {
					const setDesc = Object.getOwnPropertyDescriptor((Set as any).prototype, sym);
					if (setDesc && setDesc.writable === false) throw new Error('set_toStringTag_readonly');
				}
			}
		} catch (e) {
			if (active) setMode('basic');
			return () => { active = false; };
		}

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

