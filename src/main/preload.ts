import { contextBridge, ipcRenderer } from 'electron';
import { ConnectionProfile } from '../shared/types';

// تعریف API کامل برای ارتباط امن بین فرانت‌اند و بک‌اند
export const api = {
  // دریافت پروفایل‌ها از لینک اشتراک
  // FIX: Added subName parameter to match the call from the renderer and the handler in the main process.
  getProfilesFromSub: (subLink: string, subName: string): Promise<{ success: boolean, data?: ConnectionProfile[], error?: string }> => {
    return ipcRenderer.invoke('get-profiles-from-sub', subLink, subName);
  },
  
  // تست پینگ یک نود خاص
  testNodeLatency: (profile: ConnectionProfile): Promise<number> => {
    return ipcRenderer.invoke('test-node-latency', profile);
  },

  // شروع اتصال با یک پروفایل
  startV2Ray: (profile: ConnectionProfile): Promise<{ success: boolean, error?: string }> => {
    return ipcRenderer.invoke('start-v2ray', profile);
  },

  // قطع اتصال فعلی
  stopV2Ray: (): void => {
    ipcRenderer.invoke('stop-v2ray');
  },
};

// این API را به صورت امن به پنجره اصلی (window.api) اضافه می‌کنیم
contextBridge.exposeInMainWorld('api', api);