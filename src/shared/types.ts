export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  TESTING = 'TESTING',
  ERROR = 'ERROR'
}

// اینترفیس کامل برای یک نود استخراج شده از لینک اشتراک
export interface ConnectionProfile {
  id: string; // شناسه منحصر به فرد (مثلاً hash از کانفیگ)
  name: string; // نام نود (ps)
  type: 'vmess' | 'vless' | 'trojan' | 'shadowsocks';
  server: string; // آدرس سرور (add)
  port: number; // پورت (port)
  uuid: string; // UUID برای vmess/vless
  // ... سایر پارامترهای خاص هر پروتکل
  config: any; // آبجکت کامل کانفیگ نود
  ping?: number; // پینگ به میلی‌ثانیه
}
