import { ChildProcess } from 'child_process';
import { ConnectionProfile } from '../../shared/types';
import * as xrayEngine from './xray-engine';
import * as hysteriaEngine from './hysteria-engine';
import * as shadowsocksEngine from './shadowsocks-engine';

// A simple state to keep track of the currently active process
let activeProcess: ChildProcess | null = null;

// Generic interface for a VPN engine
interface VpnEngine {
  start(profile: ConnectionProfile): Promise<ChildProcess>;
  buildTestConfig?(profile: ConnectionProfile): string;
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
  stopEngine(); // Ensure any old process is stopped first
  
  const engine = getEngineForProfile(profile);
  activeProcess = await engine.start(profile);
  
  activeProcess.on('exit', () => {
    activeProcess = null;
    console.log(`Engine process for ${profile.name} exited.`);
  });
}

export function stopEngine(): void {
  if (activeProcess) {
    activeProcess.kill('SIGTERM');
    activeProcess = null;
    console.log('Active VPN engine stopped.');
  }
}

export async function testNodeLatency(profile: ConnectionProfile): Promise<number> {
    const engine = getEngineForProfile(profile);
    return engine.test(profile);
}