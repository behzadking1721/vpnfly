import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import axios from 'axios';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { ConnectionProfile } from '../../shared/types';
import { getBinaryPath } from './utils';
// FIX: Added import for Buffer to resolve type error.
import { Buffer } from 'buffer';

const TEST_SOCKS_PORT = 10888;
const TEST_TARGET_URL = 'http://www.google.com/generate_204'; // A lightweight, no-content endpoint for connectivity tests
const TEST_TIMEOUT = 5000; // 5 seconds

function buildTestConfig(profile: ConnectionProfile): string {
    const baseConfig = {
      log: { loglevel: 'warning' }, // Keep logs quiet during testing
      inbounds: [{
        port: TEST_SOCKS_PORT,
        listen: "127.0.0.1",
        protocol: "socks",
        settings: { auth: "noauth", udp: false }
      }],
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
    return JSON.stringify(baseConfig);
}

export async function testNodeLatency(profile: ConnectionProfile): Promise<number> {
    console.log(`[Test] Starting latency test for: ${profile.name}`);
  
    let testProcess: ChildProcess | null = null;
    // Sanitize profile ID for use in a filename
    const sanitizedId = profile.id.replace(/[^a-zA-Z0-9]/g, '');
    const configPath = path.join(app.getPath('userData'), `test_config_${sanitizedId}.json`);
  
    try {
        const configJson = buildTestConfig(profile);
        fs.writeFileSync(configPath, configJson);

        // FIX: Added 'xray' argument to getBinaryPath to satisfy its signature.
        const binaryPath = getBinaryPath('xray');
        testProcess = spawn(binaryPath, ['-c', configPath]);

        // Add listeners to debug the test process if needed
        testProcess.stderr?.on('data', (data) => console.debug(`[Test] stderr for ${profile.name}: ${data.toString()}`));
        testProcess.on('error', (err) => { throw err; });

        // Wait for the V2Ray/Xray process to confirm it has started
        await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('Test process failed to start in time')), 3000);
            
            const onData = (data: Buffer) => {
                if (data.toString().includes('started')) {
                    clearTimeout(timer);
                    resolve();
                }
            };
            
            testProcess?.stdout?.on('data', onData);
            testProcess?.stderr?.on('data', onData); // Some cores log start message to stderr

            testProcess?.on('close', (code) => {
                clearTimeout(timer);
                if (code !== 0) {
                    reject(new Error(`Test process exited prematurely with code ${code}`));
                }
            });
        });

        const agent = new SocksProxyAgent(`socks5://127.0.0.1:${TEST_SOCKS_PORT}`);
        const client = axios.create({ httpAgent: agent, httpsAgent: agent, timeout: TEST_TIMEOUT });

        const startTime = Date.now();
        await client.get(TEST_TARGET_URL);
        const endTime = Date.now();
        
        const latency = endTime - startTime;
        console.log(`[Test] Success for ${profile.name}: ${latency}ms`);
        return latency;

    } catch (error: any) {
        console.error(`[Test] Ping test failed for "${profile.name}":`, error.message);
        return -1; // Return -1 to indicate a failed test
    } finally {
        // Ensure cleanup happens
        if (testProcess) {
            testProcess.kill('SIGTERM');
        }
        if (fs.existsSync(configPath)) {
            try {
                fs.unlinkSync(configPath);
            } catch (e) {
                console.error(`[Test] Failed to delete temp config: ${configPath}`, e);
            }
        }
    }
}