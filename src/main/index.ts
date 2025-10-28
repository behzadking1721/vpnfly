import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseSubscription } from './core/subscription';
import { startEngine, stopEngine, testNodeLatency } from './core/engine-manager';
import { clearSystemProxy } from './core/system-proxy';

// Fix for __dirname not being available in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(createWindow);

// --- IPC Handlers ---

ipcMain.handle('get-profiles-from-sub', async (event, subLink: string, subName: string) => {
  try {
    const profiles = await parseSubscription(subLink, subName);
    return { success: true, data: profiles };
  } catch (error: any) {
    console.error('Failed to parse subscription:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('test-node-latency', async (event, profile) => {
  return await testNodeLatency(profile);
});

ipcMain.handle('start-v2ray', async (event, profile) => {
  try {
    await startEngine(profile);
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to start engine for ${profile.type}:`, error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-v2ray', async () => {
  await stopEngine();
});

// اطمینان از خاموش شدن موتور و پاک شدن پروکسی هنگام خروج از برنامه
app.on('will-quit', async (event) => {
    event.preventDefault(); // Prevent immediate exit
    console.log("will-quit event: Stopping engine and clearing proxy...");
    try {
        await stopEngine();
    } catch (e) {
        console.error("Error during shutdown:", e);
    } finally {
        app.exit();
    }
});
