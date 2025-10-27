import fs from 'fs';
import path from 'path';

/**
 * Resolve the directory where measurement CSV files are stored.
 * Preference order:
 * 1) DATA_DIR environment variable (e.g., /var/lib/site-survey/measurements)
 * 2) Repo-relative default: server/data/measurements (resolved from dist)
 */
export function getMeasurementsDir(options?: { ensure?: boolean }): string {
  const envDir = process.env.DATA_DIR;
  const dir = envDir && envDir.trim().length > 0
    ? envDir
    : path.resolve(__dirname, '../../data/measurements');
  if (options?.ensure) {
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    } catch {}
  }
  return dir;
}
