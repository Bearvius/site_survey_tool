import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import MainMenu from './pages/MainMenu';
import NewMeasurement from './pages/NewMeasurement';
import MeasurementList from './pages/MeasurementList';
import SettingsPage from './pages/SettingsPage';
import MobileGps from './pages/MobileGps';

function App() {
  return (
    <BrowserRouter>
      <header style={{ padding: 12, borderBottom: '1px solid #ddd' }}>
        <b>Wireless Site Survey</b>
        <nav style={{ marginTop: 8 }}>
          <Link to="/">Home</Link> | <Link to="/measurements">Measurements</Link> |{' '}
          <Link to="/settings">Settings</Link>
        </nav>
      </header>
      <main style={{ padding: 16 }}>
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/new" element={<NewMeasurement />} />
          <Route path="/measurements" element={<MeasurementList />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/mobile-gps" element={<MobileGps />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
