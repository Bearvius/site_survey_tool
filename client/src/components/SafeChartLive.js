import { jsx as _jsx } from "react/jsx-runtime";
import React, { Suspense } from 'react';
const LazyChart = React.lazy(() => import('./ChartLive'));
class ChartErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch() { }
    render() {
        if (this.state.hasError) {
            return (_jsx("div", { style: { padding: 12, background: '#fff8e1', border: '1px solid #f1d38a', borderRadius: 6, color: '#6b7280' }, children: "Chart is unavailable on this browser. Live values are still shown below." }));
        }
        return this.props.children;
    }
}
export default function SafeChartLive(props) {
    return (_jsx(ChartErrorBoundary, { children: _jsx(Suspense, { fallback: _jsx("div", { children: "Loading chart\u2026" }), children: _jsx(LazyChart, { ...props }) }) }));
}
