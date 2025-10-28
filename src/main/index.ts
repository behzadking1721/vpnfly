import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseSubscription } from './core/subscription';

// Fix for __dirname not being available in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173'); // آدرس سرور توسعه Vite
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(createWindow);

// --- IPC Handlers ---
// این بخش به UI اجازه می‌دهد تا با بک‌اند صحبت کند

// دریافت لینک اشتراک از UI، پردازش آن و بازگرداندن پروفایل‌ها
ipcMain.handle('get-profiles-from-sub', async (event, subLink: string) => {
  try {
    const profiles = await parseSubscription(subLink);
    return profiles;
  } catch (error) {
    console.error('Failed to parse subscription:', error);
    return []; // یا ارسال خطا به UI
  }
});
