import { ChildProcess } from 'child_process';
import { ConnectionProfile } from '../../shared/types';
import * as xrayEngine from './xray-engine';
import * as hysteriaEngine from './hysteria-engine';
import * as shadowsocksEngine from './shadowsocks-engine';
import { setSystemProxy, clearSystemProxy } from './system-proxy';

let activeProcesses: ChildProcess[] = [];

interface VpnEngine {
  start(profile: ConnectionProfile): Promise<ChildProcess[]>;
  test(profile: ConnectionProfile): Promise<number>;
}

function getEngineForProfile(profile: ConnectionProfile): VpnEngine {
  switch (profile.type) {
    case 'vmess':
    case 'vless':
    case 'trojan':
      return xrayEngine;
    case 'hysteria2':
      return hysteriaEngine;
    case 'shadowsocks':
      return shadowsocksEngine;
    default:
      throw new Error(`Unsupported profile type: ${profile.type}`);
  }
}

export async function startEngine(profile: ConnectionProfile): Promise<void> {
  await stopEngine(); // Ensure any old process/proxy setting is stopped first
  
  const engine = getEngineForProfile(profile);
  activeProcesses = await engine.start(profile);
  
  for (const process of activeProcesses) {
    process.on('exit', (code) => {
      // If one process in the chain dies, stop the entire engine and clean up.
      console.log(`A VPN engine process exited with code ${code}. Cleaning up the entire stack.`);
      // Check if there are still active processes to avoid recursive calls
      if (activeProcesses.length > 0) {
        stopEngine();
      }
    });
  }

  // بعد از اجرای موفقیت‌آمیز موتور، پروکسی سیستم را تنظیم کن
  await setSystemProxy();
}

export async function stopEngine(): Promise<void> {
  if (activeProcesses.length > 0) {
    console.log(`Stopping ${activeProcesses.length} active VPN engine processes.`);
    for (const process of activeProcesses) {
        process.kill('SIGTERM');
    }
    activeProcesses = [];
  }
  // همیشه هنگام توقف، پروکسی سیستم را پاک کن
  await clearSystemProxy();
}

export async function testNodeLatency(profile: ConnectionProfile): Promise<number> {
    const engine = getEngineForProfile(profile);
    return engine.test(profile);
}
