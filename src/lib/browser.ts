import puppeteer from "puppeteer-extra";
import type { Browser } from "puppeteer-core";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import chromium from "@sparticuz/chromium";
import osRelease from "linux-os-release";

let browser: Browser | null = null;

// Configure stealth plugin (disable some evasions)
const stealth = StealthPlugin();
stealth.enabledEvasions.delete("iframe.contentWindow");
stealth.enabledEvasions.delete("media.codecs");
puppeteer.use(stealth);

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

    browser = await puppeteer.launch({
        headless: process.platform === "linux" ? true : false,
        executablePath,
        args,
        userDataDir: "user_data",
    });

    if (!browser) {
        throw new Error("Browser not initialized");
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
    await page.setUserAgent({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    });
    return page;
}
