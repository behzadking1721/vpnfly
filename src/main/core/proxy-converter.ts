import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { getBinaryPath } from './utils';

const HTTP_INBOUND_PORT = 10809;
const SOCKS_OUTBOUND_HOST = '127.0.0.1';

/**
 * Starts a simple Xray process that listens for HTTP traffic on one port
 * and forwards it to a SOCKS5 proxy on another port.
 * @param socksPort The port where the source SOCKS5 proxy is listening.
 * @returns A promise that resolves with the converter's child process.
 */
export function startSocksToHttpConverter(socksPort: number): Promise<ChildProcess> {
    return new Promise((resolve, reject) => {
        const config = {
            log: { loglevel: 'warning' },
            inbounds: [{
                port: HTTP_INBOUND_PORT,
                listen: '127.0.0.1',
                protocol: 'http',
                settings: {}
            }],
            outbounds: [{
                protocol: 'socks',
                settings: {
                    servers: [{
                        address: SOCKS_OUTBOUND_HOST,
                        port: socksPort
                    }]
                }
            }]
        };

        const configJson = JSON.stringify(config);
        const configPath = path.join(app.getPath('userData'), 'converter_config.json');
        fs.writeFileSync(configPath, configJson);

        try {
            const xrayPath = getBinaryPath('xray');
            const process = spawn(xrayPath, ['-c', configPath]);
            console.log(`[Converter] SOCKS (${socksPort}) to HTTP (${HTTP_INBOUND_PORT}) converter started.`);
            // Give it a moment to start up
            setTimeout(() => resolve(process), 500);
        } catch (error) {
            console.error('[Converter] Failed to start:', error);
            reject(error);
        }
    });
}
