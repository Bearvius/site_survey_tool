import { Router } from 'express';
import { settingsService } from '../services/settingsService';
import { measurementService } from '../services/measurementService';
import { gpsService } from '../services/gpsService';
import path from 'path';
import fs from 'fs';
import dayjs from 'dayjs';
import { computeStats, parseCsv, buildSeries } from '../utils/csvStats';
import { getMeasurementsDir } from '../utils/paths';

export const router = Router();

// Settings CRUD
router.get('/settings', (_req, res) => {
  res.json(settingsService.get());
});

router.put('/settings', (req, res) => {
  settingsService.update(req.body);
  res.json(settingsService.get());
});

// Measurement control
router.post('/measurements/start', (req, res) => {
  try {
    const { location } = req.body as { location: string };
    const ok = measurementService.start(location);
    if (!ok) return res.status(400).json({ error: 'Location required or already running' });
    res.json({ status: 'started' });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/measurements/location', (req, res) => {
  const { location } = req.body as { location: string };
  measurementService.setLocation(location);
  res.json({ status: 'ok' });
});

router.post('/measurements/pause', (_req, res) => {
  measurementService.pause();
  res.json({ status: 'paused' });
});

router.post('/measurements/resume', (_req, res) => {
  measurementService.resume();
  res.json({ status: 'resumed' });
});

router.post('/measurements/stop', (_req, res) => {
  const file = measurementService.stop();
  if (!file) return res.status(400).json({ error: 'No active measurement' });
  res.json({ file });
});

router.post('/measurements/cancel', (_req, res) => {
  measurementService.cancel();
  res.json({ status: 'cancelled' });
});

// Mobile GPS endpoint (when gpsMode = mobile)
router.post('/gps/mobile', (req, res) => {
  const { lat, lon } = req.body as { lat: number; lon: number };
  if (typeof lat === 'number' && typeof lon === 'number') {
    gpsService.setMobileFix(lat, lon);
    res.json({ status: 'ok' });
  } else {
    res.status(400).json({ error: 'lat/lon required' });
  }
});

router.get('/measurements', (_req, res) => {
  const dir = getMeasurementsDir();
  if (!fs.existsSync(dir)) return res.json([]);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.csv'));
  const list = files.map((f, idx) => {
    const id = f.replace(/\.csv$/, '');
    const full = path.join(dir, f);
    const lastUnd = id.lastIndexOf('_');
    const safeName = lastUnd >= 0 ? id.slice(0, lastUnd) : id;
    const tsStr = lastUnd >= 0 ? id.slice(lastUnd + 1) : '';
    // Parse YYYY-MM-DD_HH-mm-ss without relying on dayjs customParseFormat
    let timestamp = '';
    if (tsStr) {
      const [dPart, tPart] = tsStr.split('_');
      if (dPart && tPart) {
        const [y, m, d] = dPart.split('-').map(Number);
        const [hh, mm, ss] = tPart.split('-').map(Number);
        const date = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0);
        timestamp = dayjs(date).format('HH:mm:ss DD-MMM-YY');
      }
    }
    let durationSec = 0, avgRssi = 0, avgPer = 0;
    try {
      const rows = parseCsv(full);
      const stats = computeStats(rows);
      durationSec = stats.durationSec; avgRssi = stats.avgRssi; avgPer = stats.avgPer;
    } catch {}
    return {
      number: idx + 1,
      id,
      name: safeName?.replace(/_/g, ' ') ?? 'Unknown',
      timestamp,
      durationSec,
      avgRssi,
      avgPer,
      filename: f
    };
  });
  res.json(list);
});

router.get('/measurements/:file', (req, res) => {
  const file = req.params.file;
  const full = path.resolve(getMeasurementsDir(), file);
  if (!fs.existsSync(full)) return res.status(404).send('Not found');
  res.sendFile(full);
});

router.get('/measurements/:file/details', (req, res) => {
  const file = req.params.file;
  const full = path.resolve(getMeasurementsDir(), file);
  if (!fs.existsSync(full)) return res.status(404).send('Not found');
  try {
    const rows = parseCsv(full);
    const stats = computeStats(rows);
    const series = buildSeries(rows);
    res.json({ stats, series });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.delete('/measurements/:file', (req, res) => {
  const file = req.params.file;
  const full = path.resolve(getMeasurementsDir(), file);
  if (!fs.existsSync(full)) return res.status(404).send('Not found');
  fs.unlinkSync(full);
  res.json({ status: 'deleted' });
});
