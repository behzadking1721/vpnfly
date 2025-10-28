import path from 'path';
import fs from 'fs';
import { app } from 'electron';

/**
 * Determines the correct path for the V2Ray/Xray binary.
 * This can be expanded to support multiple OS and architectures.
 * @returns The absolute path to the binary.
 * @throws An error if the binary is not found.
 */
export function getBinaryPath(): string {
  // This is a simplified example for Windows. A real app would check
  // process.platform and process.arch to determine the correct binary.
  // e.g., 'assets/binaries/linux/xray', 'assets/binaries/mac/xray'
  const binaryName = 'xray.exe';
  const platformDir = 'win';

  // In production, app.getAppPath() points to the app's root in the ASAR archive.
  // We assume the binaries are packaged alongside the main script.
  const binaryPath = path.join(app.getAppPath(), `dist/assets/binaries/${platformDir}/${binaryName}`);
  
  if (!fs.existsSync(binaryPath)) {
      throw new Error(`V2Ray/Xray binary not found at ${binaryPath}`);
  }
  return binaryPath;
}
