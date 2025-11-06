import React, { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';

type DeviceSeries = {
	id: number;
	tag?: string;
	points: { t: number; rssi: number; per: number }[];
};

// Professional SVG-based chart without Recharts dependencies to eliminate invariant crashes
export default function ChartLive({ series, markers }: { series: DeviceSeries[]; markers?: number[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 320 });

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (Number.isFinite(w) && w > 0) {
          setDimensions({ width: w, height: 320 });
        }
      }
    });
    ro.observe(el);
    // Initial measure
    const rect = el.getBoundingClientRect();
    if (rect && rect.width) setDimensions({ width: rect.width, height: 320 });
    return () => ro.disconnect();
  }, []);
  // Build unified data structure
  const allTs: number[] = [];
  for (const s of series) for (const p of s.points) if (Number.isFinite(p.t)) allTs.push(p.t);
  if (allTs.length === 0 || dimensions.width < 50) {
    return (
      <div ref={containerRef} style={{ width: '100%', height: dimensions.height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
        Waiting for data…
      </div>
    );
  }

  const minTs = Math.min(...allTs);
  const maxTs = Math.max(...allTs);
  const pad = Math.max(1000, (maxTs - minTs) * 0.05);
  const xMin = minTs === maxTs ? minTs - pad : minTs - pad;
  const xMax = minTs === maxTs ? maxTs + pad : maxTs + pad;

  // Chart layout
  const margin = { top: 20, right: 60, bottom: 40, left: 60 };
  const chartWidth = dimensions.width - margin.left - margin.right;
  const chartHeight = dimensions.height - margin.top - margin.bottom;
  const panelHeight = (chartHeight - 20) / 2; // Split for RSSI/PER

  // Scaling functions
  const scaleX = (t: number) => ((t - xMin) / (xMax - xMin)) * chartWidth;
  const scaleRssi = (v: number) => panelHeight - ((v - (-110)) / (0 - (-110))) * panelHeight;
  const scalePer = (v: number) => panelHeight - (v / 100) * panelHeight;

  // Build paths for each device
  const colors = ['#3366cc', '#dc3912', '#109618', '#990099', '#0099c6', '#dd4477'];
  const rssiPaths: string[] = [];
  const perPaths: string[] = [];
  const legendItems: { color: string; label: string }[] = [];

  series.forEach((s, idx) => {
    const color = colors[idx % colors.length];
    const label = `D${s.id}${s.tag ? ` (${s.tag})` : ''}`;
    legendItems.push({ color, label });

    if (s.points.length > 0) {
      // RSSI path
      const rssiCommands: string[] = [];
      s.points.forEach((p, i) => {
        const x = scaleX(p.t);
        const y = scaleRssi(p.rssi);
        rssiCommands.push(i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `L ${x.toFixed(1)} ${y.toFixed(1)}`);
      });
      rssiPaths.push(`<path d="${rssiCommands.join(' ')}" fill="none" stroke="${color}" stroke-width="2"/>`);

      // PER path
      const perCommands: string[] = [];
      s.points.forEach((p, i) => {
        const x = scaleX(p.t);
        const y = scalePer(p.per);
        perCommands.push(i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `L ${x.toFixed(1)} ${y.toFixed(1)}`);
      });
      perPaths.push(`<path d="${perCommands.join(' ')}" fill="none" stroke="${color}" stroke-width="2"/>`);
    }
  });

  // Grid lines and axis labels
  const rssiTicks = [-110, -100, -90, -80, -70, -60, -50, -40, -30, -20, -10, 0];
  const perTicks = [0, 20, 40, 60, 80, 100];
  const timeTicks = 5;
  const timeInterval = (xMax - xMin) / timeTicks;

  // Marker lines
  const markerLines = (markers || [])
    .filter(ts => ts >= xMin && ts <= xMax)
    .map((ts, i) => {
      const x = scaleX(ts);
      return `<line x1="${x}" y1="0" x2="${x}" y2="${chartHeight}" stroke="#b8860b" stroke-dasharray="4 4" stroke-width="1"/>
              <text x="${x + 2}" y="12" font-size="10" fill="#b8860b">S${i + 1}</text>`;
    });

  return (
    <div ref={containerRef} style={{ width: '100%', height: dimensions.height }}>
      <svg width={dimensions.width} height={dimensions.height} style={{ background: '#fff' }}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* RSSI Panel */}
          <g>
            <rect x={0} y={0} width={chartWidth} height={panelHeight} fill="none" stroke="#e5e7eb"/>
            <text x={-45} y={panelHeight/2} fontSize="12" fill="#374151" textAnchor="middle" transform={`rotate(-90, -45, ${panelHeight/2})`}>RSSI (dBm)</text>
            
            {/* RSSI Grid */}
            {rssiTicks.map(tick => {
              const y = scaleRssi(tick);
              return (
                <g key={tick}>
                  <line x1={0} y1={y} x2={chartWidth} y2={y} stroke="#f3f4f6" strokeWidth="1"/>
                  <text x={-5} y={y + 3} fontSize="10" fill="#6b7280" textAnchor="end">{tick}</text>
                </g>
              );
            })}
            
            {/* RSSI Paths */}
            <g dangerouslySetInnerHTML={{ __html: rssiPaths.join('') }} />
          </g>

          {/* PER Panel */}
          <g transform={`translate(0, ${panelHeight + 20})`}>
            <rect x={0} y={0} width={chartWidth} height={panelHeight} fill="none" stroke="#e5e7eb"/>
            <text x={-45} y={panelHeight/2} fontSize="12" fill="#374151" textAnchor="middle" transform={`rotate(-90, -45, ${panelHeight/2})`}>PER (%)</text>
            
            {/* PER Grid */}
            {perTicks.map(tick => {
              const y = scalePer(tick);
              return (
                <g key={tick}>
                  <line x1={0} y1={y} x2={chartWidth} y2={y} stroke="#f3f4f6" strokeWidth="1"/>
                  <text x={-5} y={y + 3} fontSize="10" fill="#6b7280" textAnchor="end">{tick}</text>
                </g>
              );
            })}
            
            {/* PER Paths */}
            <g dangerouslySetInnerHTML={{ __html: perPaths.join('') }} />
          </g>

          {/* Time Axis */}
          <g transform={`translate(0, ${chartHeight})`}>
            {Array.from({ length: timeTicks + 1 }, (_, i) => {
              const ts = xMin + i * timeInterval;
              const x = scaleX(ts);
              return (
                <g key={i}>
                  <line x1={x} y1={0} x2={x} y2={5} stroke="#6b7280"/>
                  <text x={x} y={18} fontSize="10" fill="#6b7280" textAnchor="middle">
                    {dayjs(ts).format('HH:mm:ss')}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Markers */}
          <g dangerouslySetInnerHTML={{ __html: markerLines.join('') }} />
        </g>

        {/* Legend */}
        <g transform={`translate(${margin.left}, ${dimensions.height - 15})`}>
          {legendItems.map((item, i) => (
            <g key={i} transform={`translate(${i * 120}, 0)`}>
              <line x1={0} y1={0} x2={15} y2={0} stroke={item.color} strokeWidth="2"/>
              <text x={20} y={4} fontSize="11" fill="#374151">{item.label}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

