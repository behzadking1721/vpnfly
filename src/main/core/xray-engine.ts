import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import axios from 'axios';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { ConnectionProfile } from '../../shared/types';
import { getBinaryPath } from './utils';

const TEST_SOCKS_PORT = 10888;
const MAIN_SOCKS_PORT = 10808;
const MAIN_HTTP_PORT = 10809;
const TEST_TARGET_URL = 'http://www.google.com/generate_204';
const TEST_TIMEOUT = 5000;

function buildConfig(profile: ConnectionProfile, isTest: boolean): string {
  const socksPort = isTest ? TEST_SOCKS_PORT : MAIN_SOCKS_PORT;
  
  const baseConfig: any = {
    log: { loglevel: 'warning' },
    inbounds: [
      {
        port: socksPort,
        listen: "127.0.0.1",
        protocol: "socks",
        settings: { auth: "noauth", udp: true }
      }
    ],
    outbounds: [{
      protocol: profile.type,
      settings: {},
      streamSettings: {
        network: profile.network || 'tcp',
        security: profile.security || 'none',
        tlsSettings: profile.security === 'tls' ? { serverName: profile.sni || profile.server, allowInsecure: false } : undefined,
        wsSettings: profile.network === 'ws' ? { path: profile.path || '/' } : undefined,
      }
    }]
  };

  if (!isTest) {
    baseConfig.inbounds.push({
      port: MAIN_HTTP_PORT,
      listen: "127.0.0.1",
      protocol: "http",
      settings: {}
    });
  }

  const outboundSettings: any = {};
  if (profile.type === 'vmess' || profile.type === 'vless') {
    outboundSettings.vnext = [{
      address: profile.server,
      port: profile.port,
      users: [{
        id: profile.uuid,
        alterId: profile.type === 'vmess' ? (profile.config.aid || 0) : undefined,
        security: profile.type === 'vmess' ? (profile.config.scy || "auto") : undefined,
        flow: profile.type === 'vless' ? "xtls-rprx-vision" : undefined
      }]
    }];
  } else if (profile.type === 'trojan') {
    outboundSettings.servers = [{
      address: profile.server,
      port: profile.port,
      password: profile.password
    }];
  }

  baseConfig.outbounds[0].settings = outboundSettings;
  return JSON.stringify(baseConfig, null, 2);
}

export function start(profile: ConnectionProfile): Promise<ChildProcess[]> {
  return new Promise((resolve, reject) => {
    const configJson = buildConfig(profile, false);
    const configPath = path.join(app.getPath('userData'), 'config.json');
    fs.writeFileSync(configPath, configJson);
    
    try {
        const binaryPath = getBinaryPath('xray');
        const process = spawn(binaryPath, ['-c', configPath]);
        // Simple assumption of success for now
        setTimeout(() => resolve([process]), 1000); 
    } catch (error) {
        reject(error);
    }
  });
}

export async function test(profile: ConnectionProfile): Promise<number> {
    let testProcess: ChildProcess | null = null;
    const configPath = path.join(app.getPath('userData'), `test_config_xray_${Date.now()}.json`);
  
    try {
        const configJson = buildConfig(profile, true);
        fs.writeFileSync(configPath, configJson);

        const binaryPath = getBinaryPath('xray');
        testProcess = spawn(binaryPath, ['-c', configPath]);

        await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('Test process timed out')), 4000);
            const listener = (data: Buffer) => {
                if(data.toString().includes('core started')) {
                    clearTimeout(timer);
                    resolve();
                }
            };
            testProcess?.stdout?.on('data', listener);
            testProcess?.stderr?.on('data', listener);
            testProcess?.on('error', reject);
        });

        const agent = new SocksProxyAgent(`socks5://127.0.0.1:${TEST_SOCKS_PORT}`);
        const client = axios.create({ httpAgent: agent, httpsAgent: agent, timeout: TEST_TIMEOUT });

        const startTime = Date.now();
        await client.get(TEST_TARGET_URL);
        return Date.now() - startTime;
    } catch (error: any) {
        console.error(`[Xray Test] Failed for "${profile.name}":`, error.message);
        return -1;
    } finally {
        testProcess?.kill('SIGTERM');
        if (fs.existsSync(configPath)) {
            try { fs.unlinkSync(configPath); } catch {}
        }
    }
}
