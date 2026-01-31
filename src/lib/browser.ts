import puppeteer, { Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium";

let browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
    if (browser) {
        return browser;
    }

    browser = await puppeteer.launch({
        // Di Alpine biasanya kita mau headless 'new' atau true
        headless: process.platform === "linux" ? true : false, 
        
        executablePath:
            process.platform === "linux"
                ? "/usr/bin/chromium-browser" // <--- UBAH BAGIAN INI (Hardcode path Alpine)
                : "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
        
        args: process.platform === "linux"
            ? [
                // ...chromium.args,     // Tetap pakai args bawaan library biar optimasi server
                "--no-sandbox",       // <--- WAJIB di Alpine (terutama user root)
                // "--disable-gpu",      // Opsional: Membantu stabilitas
                "--disable-dev-shm-usage" // Mencegah crash memory di container
              ]
            : ["--disable-blink-features=AutomationControlled"],
            
        userDataDir: "user_data",
    });

    return browser;
}

export async function closeBrowser(): Promise<void> {
    if (browser) {
        await browser.close();
        browser = null;
    }
}

export async function newPage() {
    const br = await getBrowser();
    const page = await br.newPage();
    return page;
}