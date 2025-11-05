import React, { Suspense } from 'react';

const LazyChart = React.lazy(() => import('./ChartLive'));

class ChartErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }>{
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() { /* no-op */ }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 12, background: '#fff8e1', border: '1px solid #f1d38a', borderRadius: 6, color: '#6b7280' }}>
          Chart is unavailable on this browser. Live values are still shown below.
        </div>
      );
    }
    return this.props.children as any;
  }
}

export default function SafeChartLive(props: any) {
  return (
    <ChartErrorBoundary>
      <Suspense fallback={<div>Loading chart…</div>}>
        {/* pass through props to ChartLive */}
        <LazyChart {...props} />
      </Suspense>
    </ChartErrorBoundary>
  );
}
