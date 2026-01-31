import puppeteer, { Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium";

let browser: Browser | null = null;

/**
 * Mengambil instance browser global.
 * Jika belum ada, browser akan dibuat dan disimpan secara singleton.
 */
export async function getBrowser(): Promise<Browser> {
    if (browser) {
        return browser;
    }

    browser = await puppeteer.launch({
        headless: process.platform === "linux",
        executablePath:
            process.platform === "linux"
                ? await chromium.executablePath()
                : "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
        args: process.platform === "linux"
            ? chromium.args
            : ["--disable-blink-features=AutomationControlled"],
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
}

/**
 * Helper untuk memastikan browser selalu tersedia
 * dan otomatis membuat page baru.
 */
export async function newPage() {
    const br = await getBrowser();
    const page = await br.newPage();
    return page;
}
