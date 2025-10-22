import React from 'react';

export default function GpsStatus({ source, fix, lat, lon }: { source: 'external' | 'mobile' | 'off'; fix?: boolean; lat?: number; lon?: number }) {
  const label = source === 'external' ? 'External GPS Chip' : source === 'mobile' ? 'Mobile phone' : 'Off';
  return (
    <div style={{ fontSize: 14 }}>
      <b>GPS:</b> {label} — {fix ? 'Fix' : 'No Fix'} {fix && lat && lon ? `(${lat.toFixed(5)}, ${lon.toFixed(5)})` : ''}
    </div>
  );
}
