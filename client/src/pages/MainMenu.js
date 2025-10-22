import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
export default function MainMenu() {
    const nav = useNavigate();
    return (_jsxs("div", { style: { display: 'grid', gap: 12 }, children: [_jsx("button", { onClick: () => nav('/new'), style: { padding: 12, fontSize: 16 }, children: "New Measurement" }), _jsx("button", { onClick: () => nav('/measurements'), style: { padding: 12, fontSize: 16 }, children: "Measurement List" }), _jsx("button", { onClick: () => nav('/settings'), style: { padding: 12, fontSize: 16 }, children: "Settings" })] }));
}
