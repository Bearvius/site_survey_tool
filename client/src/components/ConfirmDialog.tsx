import React from 'react';

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }: { open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center' }}>
      <div style={{ background: 'white', padding: 16, borderRadius: 8, maxWidth: 420, width: '90%' }}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onConfirm} style={{ background: '#d9534f', color: 'white' }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
