export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTING = 'DISCONNECTING',
  TESTING = 'TESTING',
  ERROR = 'ERROR'
}

export interface Subscription {
  id: string; // شناسه منحصر به فرد (e.g., timestamp)
  name: string; // نام دلخواه کاربر
  url: string; // لینک اشتراک
}

// اینترفیس کامل برای یک نود استخراج شده از لینک اشتراک
export interface ConnectionProfile {
  id: string; // شناسه منحصر به فرد (مثلاً hash از کانفیگ)
  name: string; // نام نود (ps)
  type: 'vmess' | 'vless' | 'trojan' | 'shadowsocks' | 'hysteria2' | 'unknown';
  server: string; // آدرس سرور (add)
  port: number; // پورت (port)
  
  // Fields for vmess/vless
  uuid?: string; 
  
  // Fields for trojan/hysteria2
  password?: string;

  // Fields for shadowsocks
  method?: string;

  // Stream settings (for xray)
  network?: string; // ws, tcp, grpc
  security?: string; // tls
  sni?: string; // server name indication for tls
  path?: string; // path for ws/grpc

  config: any; // آبجکت کامل کانفیگ نود برای دسترسی‌های آتی
  subscriptionName: string; // نام اشتراکی که این پروفایل از آن آمده
  
  // فیلدهای مربوط به وضعیت در UI
  ping?: number; // پینگ به میلی‌ثانیه
  status?: 'testing' | 'tested'; // وضعیت تست پینگ هر نود
}