import { ChildProcess, spawn } from 'child_process';
import axios from 'axios';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { ConnectionProfile } from '../../shared/types';
import { getBinaryPath } from './utils';

const TEST_SOCKS_PORT = 10886; // Different port to avoid conflict
const MAIN_SOCKS_PORT = 10808;
const TEST_TARGET_URL = 'http://www.google.com/generate_204';
const TEST_TIMEOUT = 5000;

function getArgs(profile: ConnectionProfile, isTest: boolean): string[] {
    const port = isTest ? TEST_SOCKS_PORT : MAIN_SOCKS_PORT;
    return [
        '-s', profile.server,
        '-p', String(profile.port),
        '-k', profile.password || '',
        '-m', profile.method || '',
        '-l', String(port),
        '-v' // Verbose for listening to start-up messages
    ];
}

export function start(profile: ConnectionProfile): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    try {
        const binaryPath = getBinaryPath('shadowsocks');
        const args = getArgs(profile, false);
        const process = spawn(binaryPath, args);
        setTimeout(() => resolve(process), 1000);
    } catch (error) {
        reject(error);
    }
  });
}

export async function test(profile: ConnectionProfile): Promise<number> {
    let testProcess: ChildProcess | null = null;
    
    try {
        const binaryPath = getBinaryPath('shadowsocks');
        const args = getArgs(profile, true);
        testProcess = spawn(binaryPath, args);
        
        await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('SS test process timed out')), 4000);
            testProcess?.stderr?.once('data', (data) => {
                // ss-local logs to stderr
                if (data.toString().includes('listening at')) {
                    clearTimeout(timer);
                    resolve();
                }
            });
            testProcess?.on('error', reject);
        });

        const agent = new SocksProxyAgent(`socks5://127.0.0.1:${TEST_SOCKS_PORT}`);
        const client = axios.create({ httpAgent: agent, httpsAgent: agent, timeout: TEST_TIMEOUT });

        const startTime = Date.now();
        await client.get(TEST_TARGET_URL);
        return Date.now() - startTime;
    } catch (error: any) {
        console.error(`[Shadowsocks Test] Failed for "${profile.name}":`, error.message);
        return -1;
    } finally {
        testProcess?.kill('SIGTERM');
    }
}