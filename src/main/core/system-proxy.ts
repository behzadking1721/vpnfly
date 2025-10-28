import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

const PROXY_HOST = '127.0.0.1';
// ما از پروکسی HTTP که توسط موتورها روی این پورت ارائه می‌شود استفاده می‌کنیم
// زیرا تنظیمات پروکسی HTTP در سطح سیستم‌عامل پشتیبانی بهتری دارد
const HTTP_PROXY_PORT = 10809; 

async function executeCommand(command: string) {
  try {
    const { stdout, stderr } = await execPromise(command);
    if (stderr) console.error(`[SystemProxy] stderr: ${stderr}`);
    console.log(`[SystemProxy] Command executed successfully: ${command}`);
    return stdout;
  } catch (error) {
    console.error(`[SystemProxy] Failed to execute command: ${command}`, error);
    throw error;
  }
}

// تابع کمکی برای پیدا کردن سرویس شبکه فعال در macOS
async function getActiveNetworkService(): Promise<string | null> {
    try {
        const { stdout } = await execPromise("scutil <<< 'show State:/Network/Global/IPv4' | grep PrimaryService | awk '{print $3}'");
        const serviceId = stdout.trim();
        if (!serviceId) return null;

        const { stdout: servicesStdout } = await execPromise("networksetup -listallnetworkservices");
        const services = servicesStdout.split('\n').slice(1);
        for (const service of services) {
            const { stdout: serviceIdStdout } = await execPromise(`networksetup -getservicedisplayname "${service}" > /dev/null 2>&1 ; scutil <<< "show Setup:/Network/Service/${serviceId}/Service" | grep UserDefinedName | awk -F': ' '{print $2}'`);
            if (serviceIdStdout.trim() === service) {
                 return service;
            }
        }
        // Fallback for older macOS or different configs
        const wifiInfo = await execPromise("networksetup -listallhardwareports | awk '/Hardware Port: Wi-Fi/{getline; print $2}'");
        if(wifiInfo.stdout.trim()){
            return "Wi-Fi";
        }
        return "Ethernet";

    } catch (e) {
        console.error("[SystemProxy] Error getting active network service on macOS:", e);
        // Fallback to most common services
        return "Wi-Fi";
    }
}

// توابع اصلی
export async function setSystemProxy(): Promise<void> {
  console.log('[SystemProxy] Setting system proxy...');
  switch (process.platform) {
    case 'win32':
      await executeCommand(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f`);
      await executeCommand(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d "${PROXY_HOST}:${HTTP_PROXY_PORT}" /f`);
      break;
    case 'darwin':
      const service = await getActiveNetworkService();
      if (service) {
        await executeCommand(`networksetup -setwebproxy "${service}" ${PROXY_HOST} ${HTTP_PROXY_PORT}`);
        await executeCommand(`networksetup -setsecurewebproxy "${service}" ${PROXY_HOST} ${HTTP_PROXY_PORT}`);
      } else {
        console.error('[SystemProxy] Could not find active network service on macOS.');
      }
      break;
    case 'linux':
       // برای محیط دسکتاپ گنوم
      await executeCommand(`gsettings set org.gnome.system.proxy mode 'manual'`);
      await executeCommand(`gsettings set org.gnome.system.proxy.http host '${PROXY_HOST}'`);
      await executeCommand(`gsettings set org.gnome.system.proxy.http port ${HTTP_PROXY_PORT}`);
      await executeCommand(`gsettings set org.gnome.system.proxy.https host '${PROXY_HOST}'`);
      await executeCommand(`gsettings set org.gnome.system.proxy.https port ${HTTP_PROXY_PORT}`);
      break;
    default:
      console.warn(`[SystemProxy] Platform ${process.platform} is not supported for automatic proxy setting.`);
  }
}

export async function clearSystemProxy(): Promise<void> {
  console.log('[SystemProxy] Clearing system proxy...');
  switch (process.platform) {
    case 'win32':
      await executeCommand(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f`);
      break;
    case 'darwin':
      const service = await getActiveNetworkService();
      if (service) {
        await executeCommand(`networksetup -setwebproxystate "${service}" off`);
        await executeCommand(`networksetup -setsecurewebproxystate "${service}" off`);
      } else {
        console.error('[SystemProxy] Could not find active network service on macOS.');
      }
      break;
    case 'linux':
       // برای محیط دسکتاپ گنوم
      await executeCommand(`gsettings set org.gnome.system.proxy mode 'none'`);
      break;
    default:
      console.warn(`[SystemProxy] Platform ${process.platform} is not supported for automatic proxy clearing.`);
  }
}
