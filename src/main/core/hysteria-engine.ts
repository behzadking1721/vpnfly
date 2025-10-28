import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import axios from 'axios';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { ConnectionProfile } from '../../shared/types';
import { getBinaryPath } from './utils';

const TEST_SOCKS_PORT = 10887; // Different port to avoid conflict
const MAIN_SOCKS_PORT = 10808; // Hysteria can also provide SOCKS5
const TEST_TARGET_URL = 'http://www.google.com/generate_204';
const TEST_TIMEOUT = 5000;

function buildConfig(profile: ConnectionProfile, isTest: boolean): string {
    const socksPort = isTest ? TEST_SOCKS_PORT : MAIN_SOCKS_PORT;
    const config = {
        "server": `${profile.server}:${profile.port}`,
        "auth": profile.password,
        "tls": {
            "sni": profile.sni || profile.server,
            "insecure": false,
        },
        "socks5": {
            "listen": `127.0.0.1:${socksPort}`
        },
        "transport": {
            "type": "udp"
        }
    };
    return JSON.stringify(config, null, 2);
}

export function start(profile: ConnectionProfile): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const configJson = buildConfig(profile, false);
    const configPath = path.join(app.getPath('userData'), 'hysteria_config.json');
    fs.writeFileSync(configPath, configJson);
    
    try {
        const binaryPath = getBinaryPath('hysteria');
        const process = spawn(binaryPath, ['client', '-c', configPath]);
        setTimeout(() => resolve(process), 1000);
    } catch (error) {
        reject(error);
    }
  });
}

export async function test(profile: ConnectionProfile): Promise<number> {
    let testProcess: ChildProcess | null = null;
    const configPath = path.join(app.getPath('userData'), `test_config_hy2_${Date.now()}.json`);

    try {
        const configJson = buildConfig(profile, true);
        fs.writeFileSync(configPath, configJson);

        const binaryPath = getBinaryPath('hysteria');
        testProcess = spawn(binaryPath, ['client', '-c', configPath]);

        await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('Hysteria test process timed out')), 4000);
            const listener = (data: Buffer) => {
                if(data.toString().includes('Client up')) {
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
        console.error(`[Hysteria Test] Failed for "${profile.name}":`, error.message);
        return -1;
    } finally {
        testProcess?.kill('SIGTERM');
        if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
    }
}