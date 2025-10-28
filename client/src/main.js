import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import MainMenu from './pages/MainMenu';
import NewMeasurement from './pages/NewMeasurement';
import MeasurementList from './pages/MeasurementList';
import SettingsPage from './pages/SettingsPage';
import MobileGps from './pages/MobileGps';
import './styles.css';
function App() {
    return (_jsxs(BrowserRouter, { children: [_jsxs("header", { style: { padding: 12, borderBottom: '1px solid #ddd' }, children: [_jsx("b", { children: "Wireless Site Survey" }), _jsxs("nav", { style: { marginTop: 8 }, children: [_jsx(Link, { to: "/", children: "Home" }), " | ", _jsx(Link, { to: "/measurements", children: "Measurements" }), " |", ' ', _jsx(Link, { to: "/settings", children: "Settings" })] })] }), _jsx("main", { style: { padding: 16 }, children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(MainMenu, {}) }), _jsx(Route, { path: "/new", element: _jsx(NewMeasurement, {}) }), _jsx(Route, { path: "/measurements", element: _jsx(MeasurementList, {}) }), _jsx(Route, { path: "/settings", element: _jsx(SettingsPage, {}) }), _jsx(Route, { path: "/mobile-gps", element: _jsx(MobileGps, {}) })] }) })] }));
}
createRoot(document.getElementById('root')).render(_jsx(App, {}));
