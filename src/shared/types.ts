export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTING = 'DISCONNECTING',
  TESTING = 'TESTING', // وضعیت کلی برای زمانی که تست پینگ در حال اجراست
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
  config: any; // آبجکت کامل کانفیگ نود
  
  // فیلدهای مربوط به وضعیت در UI
  ping?: number; // پینگ به میلی‌ثانیه
  status?: 'testing' | 'tested'; // وضعیت تست پینگ هر نود
}
