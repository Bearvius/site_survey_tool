import React, { useEffect, useRef, useState } from 'react';
import BasicChart from './basic/BasicChart';

class ChartErrorBoundary extends React.Component<{ onError: () => void; children: React.ReactNode }>{
	componentDidCatch() {
		this.props.onError();
	}
	render() { return this.props.children as any; }
}

// Dynamically import the Recharts-based ChartLive. Try it first; if the import or render
// fails (as on some Pi browsers), fall back to a minimal SVG chart. This avoids aggressively
// blocking Recharts on modern browsers (e.g., your Windows PC).
export default function SafeChartLive(props: any) {
	const ChartRef = useRef<null | React.ComponentType<any>>(null);
	const [mode, setMode] = useState<'loading' | 'recharts' | 'basic'>('loading');

	useEffect(() => {
		let active = true;
			const qp = new URLSearchParams(window.location.search);
			const force = qp.get('chart'); // 'recharts' | 'basic' | null
			if (force === 'basic') {
				console.debug('[SafeChartLive] Forcing basic chart via ?chart=basic');
				setMode('basic');
				return () => { active = false; };
			}

			console.debug('[SafeChartLive] Loading ChartLive (Recharts)...');
		import('./ChartLive')
			.then((mod) => {
				if (!active) return;
				ChartRef.current = (mod as any).default || (mod as any);
				setMode('recharts');
					console.debug('[SafeChartLive] Recharts chart loaded');
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
		return (
			<ChartErrorBoundary onError={() => setMode('basic')}>
				<C {...props} />
			</ChartErrorBoundary>
		);
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

