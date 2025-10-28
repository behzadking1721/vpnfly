import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { ConnectionProfile } from '../../shared/types';
import { getBinaryPath } from './utils';

let v2rayProcess: ChildProcess | null = null;

// تابع برای ساخت فایل کانفیگ کلاینت V2Ray/Xray
function buildClientConfig(profile: ConnectionProfile): string {
  const baseConfig = {
    "inbounds": [
      {
        "port": 10808,
        "listen": "127.0.0.1",
        "protocol": "socks",
        "settings": { "auth": "noauth", "udp": true }
      },
      {
        "port": 10809,
        "listen": "127.0.0.1",
        "protocol": "http",
        "settings": { "auth": "noauth" }
      }
    ],
    "outbounds": [
      {
        "protocol": profile.type,
        "settings": {},
        "streamSettings": {
          "network": profile.network || 'tcp',
          "security": profile.security || 'none',
          "tlsSettings": profile.security === 'tls' ? { "serverName": profile.sni || profile.server } : undefined,
          "wsSettings": profile.network === 'ws' ? { "path": profile.path || '/' } : undefined,
        }
      }
    ]
  };

  const outboundSettings: any = {};
  if (profile.type === 'vmess' || profile.type === 'vless') {
    outboundSettings.vnext = [{
      "address": profile.server,
      "port": profile.port,
      "users": [{
        "id": profile.uuid,
        "alterId": profile.type === 'vmess' ? (profile.config.aid || 0) : undefined,
        "security": profile.type === 'vmess' ? (profile.config.scy || "auto") : undefined,
        "flow": profile.type === 'vless' ? "xtls-rprx-vision" : undefined
      }]
    }];
  } else if (profile.type === 'trojan') {
    outboundSettings.servers = [{
      "address": profile.server,
      "port": profile.port,
      "password": profile.password
    }];
  }

  baseConfig.outbounds[0].settings = outboundSettings;
  
  return JSON.stringify(baseConfig, null, 2);
}

// تابع برای اجرای V2Ray
export function startV2Ray(profile: ConnectionProfile): Promise<void> {
  return new Promise((resolve, reject) => {
    stopV2Ray(); // Stop any existing process first

    const configJson = buildClientConfig(profile);
    const configPath = path.join(app.getPath('userData'), 'config.json');
    fs.writeFileSync(configPath, configJson);
    
    try {
        const binaryPath = getBinaryPath();
        
        v2rayProcess = spawn(binaryPath, ['-c', configPath]);

        v2rayProcess.stdout?.on('data', (data) => console.log(`V2Ray stdout: ${data}`));
        v2rayProcess.stderr?.on('data', (data) => console.error(`V2Ray stderr: ${data}`));
        v2rayProcess.on('close', (code) => console.log(`V2Ray process exited with code ${code}`));
        v2rayProcess.on('error', (err) => {
            console.error('Failed to start V2Ray process:', err);
            reject(err);
        });
        
        // Assume connection is successful after a short delay
        setTimeout(() => resolve(), 1500);

    } catch (error) {
        reject(error);
    }
  });
}

// تابع برای توقف V2Ray
export function stopV2Ray(): void {
  if (v2rayProcess) {
    v2rayProcess.kill('SIGTERM');
    v2rayProcess = null;
    console.log('V2Ray process stopped.');
  }
}