import path from 'path';
import fs from 'fs';
import { app } from 'electron';

export type EngineType = 'xray' | 'hysteria' | 'shadowsocks';

/**
 * Determines the correct path for a given engine's binary.
 * This is simplified for Windows, but can be extended for other platforms.
 * @param engine The type of engine to find the binary for.
 * @returns The absolute path to the binary.
 * @throws An error if the binary is not found.
 */
export function getBinaryPath(engine: EngineType): string {
  // A real app would use process.platform and process.arch for cross-platform support.
  const platformDir = 'win'; 
  let binaryName: string;

  switch (engine) {
    case 'xray':
      binaryName = 'xray.exe';
      break;
    case 'hysteria':
      binaryName = 'hysteria.exe';
      break;
    case 'shadowsocks':
      binaryName = 'ss-local.exe';
      break;
    default:
      throw new Error(`Unsupported engine type: ${engine}`);
  }

  // Path when running in development vs. packaged app can be different.
  // This logic tries to handle both.
  const baseDir = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(app.getAppPath(), 'assets'); // Adjust if your assets folder is elsewhere

  const binaryPath = path.join(baseDir, `binaries/${platformDir}/${binaryName}`);

  if (!fs.existsSync(binaryPath)) {
    // Fallback for development if structure is different
    const devPath = path.join(__dirname, `../../../../assets/binaries/${platformDir}/${binaryName}`);
    if(fs.existsSync(devPath)) return devPath;

    throw new Error(`${engine} binary not found at ${binaryPath}`);
  }
  
  return binaryPath;
}