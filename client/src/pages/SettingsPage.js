import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { api } from '../lib';
export default function SettingsPage() {
    const [s, setS] = useState(null);
    useEffect(() => { api.get('/settings').then((r) => setS(r.data)); }, []);
    function update(key, value) {
        if (!s)
            return;
        setS({ ...s, [key]: value });
    }
    async function save() {
        await api.put('/settings', s);
        alert('Settings saved');
    }
    if (!s)
        return _jsx("div", { children: "Loading\u2026" });
    return (_jsxs("div", { style: { display: 'grid', gap: 12, maxWidth: 640 }, children: [_jsx("h3", { children: "Modbus" }), _jsxs("label", { children: ["Host", _jsx("input", { value: s.modbusHost, onChange: (e) => update('modbusHost', e.target.value) })] }), _jsxs("label", { children: ["Port", _jsx("input", { type: "number", value: s.modbusPort, onChange: (e) => update('modbusPort', Number(e.target.value)) })] }), _jsxs("label", { children: ["Base Register", _jsx("input", { type: "number", value: s.modbusBaseRegister, onChange: (e) => update('modbusBaseRegister', Number(e.target.value)) })] }), _jsx("h3", { children: "GPS" }), _jsxs("label", { children: ["Mode", _jsxs("select", { value: s.gpsMode, onChange: (e) => update('gpsMode', e.target.value), children: [_jsx("option", { value: "external", children: "External GPS Chip" }), _jsx("option", { value: "mobile", children: "Mobile phone" }), _jsx("option", { value: "off", children: "Off" })] })] }), _jsxs("label", { children: ["UART Path", _jsx("input", { value: s.uartPath, onChange: (e) => update('uartPath', e.target.value) })] }), _jsxs("label", { children: ["UART Baud", _jsx("input", { type: "number", value: s.uartBaudRate, onChange: (e) => update('uartBaudRate', Number(e.target.value)) })] }), _jsx("h3", { children: "Simulation" }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: s.simulation, onChange: (e) => update('simulation', e.target.checked) }), " Enable simulation"] }), _jsx("h3", { children: "Device Tags" }), s.deviceTags.map((t, idx) => (_jsxs("div", { children: ["Device ", t.id, ": ", _jsx("input", { value: t.tag ?? '', onChange: (e) => {
                            const deviceTags = [...s.deviceTags];
                            deviceTags[idx] = { ...deviceTags[idx], tag: e.target.value };
                            update('deviceTags', deviceTags);
                        } })] }, t.id))), _jsx("h3", { children: "Color Thresholds" }), _jsx("small", { children: "These values control indicator colors. RSSI in dBm (negative): good is higher/less negative. PER in %: good is lower." }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }, children: [_jsxs("label", { children: ["RSSI Good (\u2265)", _jsx("input", { type: "number", value: s.thresholds?.rssiGood ?? -70, onChange: (e) => update('thresholds', { ...s.thresholds, rssiGood: Number(e.target.value) }) })] }), _jsxs("label", { children: ["RSSI Warn (\u2265)", _jsx("input", { type: "number", value: s.thresholds?.rssiWarn ?? -85, onChange: (e) => update('thresholds', { ...s.thresholds, rssiWarn: Number(e.target.value) }) })] }), _jsxs("label", { children: ["PER Good (\u2264)", _jsx("input", { type: "number", value: s.thresholds?.perGood ?? 2, onChange: (e) => update('thresholds', { ...s.thresholds, perGood: Number(e.target.value) }) })] }), _jsxs("label", { children: ["PER Warn (\u2264)", _jsx("input", { type: "number", value: s.thresholds?.perWarn ?? 5, onChange: (e) => update('thresholds', { ...s.thresholds, perWarn: Number(e.target.value) }) })] })] }), _jsx("div", { style: { marginTop: 12 }, children: _jsx("button", { onClick: save, children: "Save" }) })] }));
}
