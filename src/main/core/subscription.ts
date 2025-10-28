import axios from 'axios';
// Fix for Buffer not being defined
import { Buffer } from 'buffer';
import { ConnectionProfile } from '../../shared/types';

// تابع اصلی برای دریافت و پارس کردن لینک اشتراک
export async function parseSubscription(subLink: string): Promise<ConnectionProfile[]> {
  const response = await axios.get(subLink);
  const decodedData = Buffer.from(response.data, 'base64').toString('utf-8');
  
  const links = decodedData.split(/[\r\n]+/).filter(link => link.trim() !== '');
  
  const profiles: ConnectionProfile[] = links.map(link => parseV2RayLink(link)).filter(p => p !== null) as ConnectionProfile[];
  
  return profiles;
}

// تابع کمکی برای پارس کردن یک لینک تکی vmess:// یا vless://
function parseV2RayLink(link: string): ConnectionProfile | null {
  if (link.startsWith('vmess://')) {
    try {
      const base64Config = link.substring('vmess://'.length);
      const configStr = Buffer.from(base64Config, 'base64').toString('utf-8');
      const config = JSON.parse(configStr);

      return {
        id: `${config.add}:${config.port}`,
        name: config.ps || `${config.add}:${config.port}`,
        type: 'vmess',
        server: config.add,
        port: parseInt(config.port, 10),
        uuid: config.id,
        config: config,
      };
    } catch (e) {
      console.error('Failed to parse vmess link:', link, e);
      return null;
    }
  }
  // TODO: منطق مشابه برای vless, trojan, shadowsocks اضافه شود
  return null;
}
