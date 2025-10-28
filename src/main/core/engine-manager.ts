import { ChildProcess } from 'child_process';
import { ConnectionProfile } from '../../shared/types';
import * as xrayEngine from './xray-engine';
import * as hysteriaEngine from './hysteria-engine';
import * as shadowsocksEngine from './shadowsocks-engine';
import { setSystemProxy, clearSystemProxy } from './system-proxy';

let activeProcess: ChildProcess | null = null;

interface VpnEngine {
  start(profile: ConnectionProfile): Promise<ChildProcess>;
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
  activeProcess = await engine.start(profile);
  
  activeProcess.on('exit', () => {
    activeProcess = null;
    console.log(`Engine process for ${profile.name} exited.`);
    // اگر پروسه به صورت غیرمنتظره بسته شد، پروکسی را پاک کن
    clearSystemProxy().catch(err => console.error('[SystemProxy] Failed to clear proxy on unexpected exit:', err));
  });

  // بعد از اجرای موفقیت‌آمیز موتور، پروکسی سیستم را تنظیم کن
  await setSystemProxy();
}

export async function stopEngine(): Promise<void> {
  if (activeProcess) {
    activeProcess.kill('SIGTERM');
    activeProcess = null;
    console.log('Active VPN engine stopped.');
  }
  // همیشه هنگام توقف، پروکسی سیستم را پاک کن
  await clearSystemProxy();
}

export async function testNodeLatency(profile: ConnectionProfile): Promise<number> {
    const engine = getEngineForProfile(profile);
    return engine.test(profile);
}
