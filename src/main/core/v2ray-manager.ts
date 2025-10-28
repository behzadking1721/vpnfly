import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
// Fix for 'Cannot find name 'app'' error
import { app } from 'electron';
import { fileURLToPath } from 'url';
import { ConnectionProfile } from '../../shared/types';

let v2rayProcess: ChildProcess | null = null;

// Fix for __dirname not being available in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// تابع برای ساخت فایل کانفیگ کلاینت V2Ray
function buildClientConfig(profile: ConnectionProfile): string {
  const config = {
    "inbounds": [
      {
        "port": 10808, // پورت پراکسی SOCKS
        "listen": "127.0.0.1",
        "protocol": "socks",
        "settings": {
          "auth": "noauth",
          "udp": true
        }
      },
      {
        "port": 10809, // پورت پراکسی HTTP
        "listen": "127.0.0.1",
        "protocol": "http",
        "settings": {
          "auth": "noauth"
        }
      }
    ],
    "outbounds": [
      {
        "protocol": profile.type,
        "settings": {
          // اینجا تنظیمات outbound بر اساس نوع پروتکل قرار می‌گیرد
          // برای vmess:
          "vnext": [
            {
              "address": profile.server,
              "port": profile.port,
              "users": [
                {
                  "id": profile.uuid,
                  "alterId": profile.config.aid || 0,
                  "security": profile.config.scy || "auto"
                }
              ]
            }
          ]
        },
        "streamSettings": {
          // اینجا تنظیمات stream مثل ws, grpc, ... قرار می‌گیرد
          "network": profile.config.net || "tcp",
          // ...
        }
      }
    ]
  };
  return JSON.stringify(config, null, 2);
}

// تابع برای اجرای V2Ray
export function startV2Ray(profile: ConnectionProfile): Promise<void> {
  return new Promise((resolve, reject) => {
    const configJson = buildClientConfig(profile);
    const configPath = path.join(app.getPath('userData'), 'config.json');
    fs.writeFileSync(configPath, configJson);

    // مسیر باینری را بر اساس سیستم‌عامل پیدا کن
    // این یک مثال ساده است
    const binaryPath = path.join(__dirname, '../../../assets/binaries/win/xray.exe');

    if (v2rayProcess) {
      v2rayProcess.kill();
    }

    v2rayProcess = spawn(binaryPath, ['-c', configPath]);

    v2rayProcess.stdout?.on('data', (data) => console.log(`V2Ray stdout: ${data}`));
    v2rayProcess.stderr?.on('data', (data) => console.error(`V2Ray stderr: ${data}`));
    v2rayProcess.on('close', (code) => console.log(`V2Ray process exited with code ${code}`));
    
    // فرض می‌کنیم که اگر پروسه با موفقیت اجرا شد، اتصال برقرار است
    // در عمل باید منتظر پیام خاصی از stdout ماند
    setTimeout(() => resolve(), 1000);
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
