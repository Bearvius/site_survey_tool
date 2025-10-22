import axios from 'axios';
export const api = axios.create({ baseURL: '/api' });
export function fmtDuration(sec) {
    if (sec < 60)
        return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s ? `${m}m ${s}s` : `${m}m`;
}
export function sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9-_]/g, '_');
}
