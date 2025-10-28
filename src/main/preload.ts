import { contextBridge, ipcRenderer } from 'electron';
import { ConnectionProfile } from '../shared/types';

// توابعی که می‌خواهیم از فرانت‌اند (React) به آنها دسترسی داشته باشیم
const api = {
  // تابع برای ارسال درخواست دریافت پروفایل‌ها به بک‌اند
  getProfilesFromSub: (subLink: string): Promise<ConnectionProfile[]> => {
    return ipcRenderer.invoke('get-profiles-from-sub', subLink);
  },
  // اینجا توابع دیگری مثل تست نودها، اتصال و قطع اتصال اضافه خواهد شد
  // مثلا: testNode(profileId: string): Promise<number>
  // مثلا: connect(profileId: string): Promise<boolean>
  // مثلا: disconnect(): Promise<void>
};

// این API را به صورت امن به پنجره اصلی (window.api) اضافه می‌کنیم
contextBridge.exposeInMainWorld('api', api);
