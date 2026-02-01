import puppeteer from "puppeteer-extra";
import type { Browser } from "puppeteer-core";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import chromium from "@sparticuz/chromium";
import osRelease from "linux-os-release";

// Apply stealth plugin
puppeteer.use(StealthPlugin());

let browser: Browser | null = null;

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
            args = [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-software-rasterizer", "--disable-blink-features=AutomationControlled"];
        }
    } else {
        executablePath = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
        args = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-software-rasterizer", "--disable-blink-features=AutomationControlled"];
    }

    browser = await puppeteer.launch({
        headless: process.platform === "linux" ? true : true,
        executablePath,
        args,
        userDataDir: "user_data",
        defaultViewport: {
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1,
        },
    });

    if (!browser) {
        throw new Error("Failed to launch browser");
    }

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
}

/**
 * Helper untuk memastikan browser selalu tersedia
 * dan otomatis membuat page baru.
 */
export async function newPage() {
    const br = await getBrowser();
    const page = await br.newPage();

    // Set realistic viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Set realistic headers
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 OPR/126.0.0.0");
    await page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    });

    return page;
}
