// Ganti import puppeteer-core menjadi puppeteer-extra
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Browser } from "puppeteer-core"; // Tetap ambil tipe data Browser
import chromium from "@sparticuz/chromium";
import osRelease from "linux-os-release";

// Tambahkan plugin stealth ke puppeteer-extra
puppeteer.use(StealthPlugin());

let browser: any = null; // Gunakan any atau tipe dari puppeteer-extra

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
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                // Flag GPU tetap dipertahankan sesuai permintaanmu
                "--use-gl=angle",
                "--use-angle=gl-egl",
                "--use-cmd-decoder=passthrough",
                "--disable-blink-features=AutomationControlled",
            ];
        } else {
            executablePath = await chromium.executablePath();
            args = [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"];
        }
    } else {
        executablePath = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
        args = [
            "--no-sandbox", //
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-software-rasterizer",
            "--disable-blink-features=AutomationControlled",
        ];
    }

    // Panggilan launch sekarang melalui puppeteer-extra yang sudah memakai StealthPlugin
    browser = await puppeteer.launch({
        headless: false, // Disarankan false untuk login Google
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
}

/**
 * Helper untuk membuat page baru dengan Stealth terintegrasi.
 */
export async function newPage() {
    const br = await getBrowser();
    const page = await br.newPage();
    // User Agent terbaru agar sinkron dengan stealth
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6194.0 Safari/537.36");
    return page;
}
