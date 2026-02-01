import puppeteer, { Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import osRelease from "linux-os-release";
import axios from "axios";
import { spawn, type ChildProcess } from "child_process";

let browser: Browser | null = null;
let spawnedChrome: ChildProcess | null = null;

/**
 * Mengecek apakah sistem adalah Alpine Linux.
 */
async function isAlpineLinux(): Promise<boolean> {
    try {
        const info = await osRelease();
        return info.ID === "alpine";
    } catch {
        return false;
    }
}

/**
 * Mengambil instance browser global.
 * Jika belum ada, browser akan dibuat dan disimpan secara singleton.
 */
export async function getBrowser(): Promise<Browser> {
    if (browser) {
        return browser;
    }

    // If provided, connect to an existing Chrome instance via remote debugging
    const remoteWsEndpoint = process.env.CHROME_WS_ENDPOINT;
    if (remoteWsEndpoint) {
        browser = await puppeteer.connect({ browserWSEndpoint: remoteWsEndpoint });
        return browser;
    }

    // If provided, launch Chrome with remote debugging port then connect
    const remotePort = process.env.CHROME_DEBUG_PORT;

    let executablePath: string;
    let args: string[];

    if (process.platform === "linux") {
        if (await isAlpineLinux()) {
            executablePath = "/usr/bin/chromium-browser";
            args = [
                // Flag Wajib Alpine/Root
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",

                // === BAGIAN INI YANG DIUBAH UNTUK MAKSA GPU ===
                "--use-gl=angle",
                "--use-angle=gl-egl",
                "--use-cmd-decoder=passthrough",
                // =============================================

                "--disable-blink-features=AutomationControlled",
            ];
        } else {
            executablePath = await chromium.executablePath();
            args = [
                ...chromium.args,
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                // "--disable-software-rasterizer",
                "--disable-blink-features=AutomationControlled",
            ];
        }
    } else {
        executablePath = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
        args = [
            "--no-sandbox",
            "--disable-setuid-sandbox", //
            "--disable-dev-shm-usage",
            "--disable-software-rasterizer",
            "--disable-blink-features=AutomationControlled",
        ];
    }

    if (remotePort) {
        const chromeArgs = [
            `--remote-debugging-port=${remotePort}`,
            "--no-first-run",
            "--no-default-browser-check",
            ...args,
        ];

        spawnedChrome = spawn(executablePath, chromeArgs, {
            stdio: "ignore",
            detached: true,
        });

        const versionUrl = `http://127.0.0.1:${remotePort}/json/version`;
        let wsEndpoint = "";
        for (let i = 0; i < 20; i++) {
            try {
                const res = await axios.get(versionUrl, { timeout: 1000 });
                wsEndpoint = res.data?.webSocketDebuggerUrl;
                if (wsEndpoint) break;
            } catch {
                // retry
            }
            await new Promise((r) => setTimeout(r, 250));
        }

        if (!wsEndpoint) {
            throw new Error("Failed to get Chrome WebSocket endpoint");
        }

        browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint });
        return browser;
    }

    browser = await puppeteer.launch({
        headless: process.platform === "linux" ? true : false,
        executablePath,
        args,
        userDataDir: "user_data",
    });

    return browser;
}

/**
 * Menutup browser global jika sedang aktif.
 */
export async function closeBrowser(): Promise<void> {
    if (browser) {
        await browser.close();
        browser = null;
    }

    if (spawnedChrome && !spawnedChrome.killed) {
        try {
            spawnedChrome.kill();
        } catch {
            // ignore
        }
        spawnedChrome = null;
    }
}

/**
 * Helper untuk memastikan browser selalu tersedia
 * dan otomatis membuat page baru.
 */
export async function newPage() {
    const br = await getBrowser();
    const page = await br.newPage();
    await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 OPR/126.0.0.0");
    return page;
}
