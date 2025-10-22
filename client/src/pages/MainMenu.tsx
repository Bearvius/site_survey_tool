import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function MainMenu() {
  const nav = useNavigate();
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <button onClick={() => nav('/new')} style={{ padding: 12, fontSize: 16 }}>New Measurement</button>
      <button onClick={() => nav('/measurements')} style={{ padding: 12, fontSize: 16 }}>Measurement List</button>
      <button onClick={() => nav('/settings')} style={{ padding: 12, fontSize: 16 }}>Settings</button>
    </div>
  );
}
