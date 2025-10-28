import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
    if (!open)
        return null;
    return (_jsx("div", { style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center' }, children: _jsxs("div", { style: { background: 'white', padding: 16, borderRadius: 8, maxWidth: 420, width: '90%' }, children: [_jsx("h3", { children: title }), _jsx("p", { children: message }), _jsxs("div", { style: { display: 'flex', gap: 8, justifyContent: 'flex-end' }, children: [_jsx("button", { className: "btn", onClick: onCancel, children: "Cancel" }), _jsx("button", { className: "btn btn-danger", onClick: onConfirm, children: "Confirm" })] })] }) }));
}
