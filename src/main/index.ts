import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseSubscription } from './core/subscription';
import { testNodeLatency } from './core/node-tester';
import { startV2Ray, stopV2Ray } from './core/v2ray-manager';

// Fix for __dirname not being available in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 700, // کمی ارتفاع بیشتر برای UI جدید
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173'); // آدرس سرور توسعه Vite
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(createWindow);

// --- IPC Handlers ---

// دریافت و پارس کردن لینک اشتراک
ipcMain.handle('get-profiles-from-sub', async (event, subLink: string) => {
  try {
    const profiles = await parseSubscription(subLink);
    return { success: true, data: profiles };
  } catch (error: any) {
    console.error('Failed to parse subscription:', error);
    return { success: false, error: error.message };
  }
});

// تست پینگ یک نود
ipcMain.handle('test-node-latency', async (event, profile) => {
  return await testNodeLatency(profile);
});

// شروع اتصال V2Ray
ipcMain.handle('start-v2ray', async (event, profile) => {
  try {
    await startV2Ray(profile);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to start V2Ray:', error);
    return { success: false, error: error.message };
  }
});

// قطع اتصال V2Ray
ipcMain.handle('stop-v2ray', () => {
  stopV2Ray();
});
