import axios from 'axios';
import { Buffer } from 'buffer';
import { ConnectionProfile } from '../../shared/types';
import { URL } from 'url';

// تابع اصلی برای دریافت و پارس کردن لینک اشتراک
export async function parseSubscription(subUrl: string, subName: string): Promise<ConnectionProfile[]> {
  const response = await axios.get(subUrl, { timeout: 10000 });
  const decodedData = Buffer.from(response.data, 'base64').toString('utf-8');
  
  const links = decodedData.split(/[\r\n]+/).filter(link => link.trim() !== '');
  
  const profiles: ConnectionProfile[] = links.map(link => {
    const profile = parseV2RayLink(link);
    if (profile) {
      profile.subscriptionName = subName;
    }
    return profile;
  }).filter(p => p !== null) as ConnectionProfile[];
  
  return profiles;
}

// تابع کمکی برای پارس کردن یک لینک تکی
function parseV2RayLink(link: string): ConnectionProfile | null {
  try {
    const protocol = link.split('://')[0];
    switch (protocol) {
      case 'vmess':
        return parseVmessLink(link);
      case 'vless':
        return parseVlessLink(link);
      case 'trojan':
        return parseTrojanLink(link);
      default:
        return null;
    }
  } catch (error) {
    console.error(`Failed to parse link: ${link}`, error);
    return null;
  }
}

function parseVmessLink(link: string): ConnectionProfile | null {
  const base64Config = link.substring('vmess://'.length);
  const configStr = Buffer.from(base64Config, 'base64').toString('utf-8');
  const config = JSON.parse(configStr);

  return {
    id: `${config.add}:${config.port}-${config.id}`,
    name: config.ps || `${config.add}:${config.port}`,
    type: 'vmess',
    server: config.add,
    port: parseInt(config.port, 10),
    uuid: config.id,
    network: config.net,
    security: config.tls,
    sni: config.sni || config.host,
    path: config.path,
    config: config,
    subscriptionName: '', // Will be set in the main function
  };
}

function parseVlessLink(link: string): ConnectionProfile | null {
    const url = new URL(link);
    const name = decodeURIComponent(url.hash.substring(1));
    
    return {
        id: `${url.hostname}:${url.port}-${url.username}`,
        name: name || `${url.hostname}:${url.port}`,
        type: 'vless',
        server: url.hostname,
        port: parseInt(url.port, 10),
        uuid: url.username,
        network: url.searchParams.get('type') || 'tcp',
        security: url.searchParams.get('security') || 'none',
        sni: url.searchParams.get('sni'),
        path: url.searchParams.get('path'),
        config: Object.fromEntries(url.searchParams.entries()),
        subscriptionName: '',
    };
}

function parseTrojanLink(link: string): ConnectionProfile | null {
    const url = new URL(link);
    const name = decodeURIComponent(url.hash.substring(1));
    
    return {
        id: `${url.hostname}:${url.port}-${url.username}`,
        name: name || `${url.hostname}:${url.port}`,
        type: 'trojan',
        server: url.hostname,
        port: parseInt(url.port, 10),
        password: url.username,
        sni: url.searchParams.get('sni'),
        config: Object.fromEntries(url.searchParams.entries()),
        subscriptionName: '',
    };
}
