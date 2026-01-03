import puppeteer, { type Browser } from "puppeteer-core";
import "dotenv/config";
import chromium from "@sparticuz/chromium";
import path from "path";

let browser: Browser | null = null;

export async function getBrowser() {
    if (browser && browser.isConnected()) {
        return browser;
    }

    if (process.env.NODE_ENV === "development") {
        browser = await puppeteer.launch({
            executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Adjust path for your OS
            headless: false,
            pipe: true,
            enableExtensions: [path.join(__dirname, "../../../NopeCHA")],
            args: [
                "--disable-blink-features=AutomationControlled", //
                "--disable-web-security",
            ],
            // userDataDir: "./puppeteer_data",
        });
    } else {
        browser = await puppeteer.launch({
            executablePath: await chromium.executablePath(),
            headless: "shell",
            pipe: true,
            enableExtensions: [path.join(__dirname, "../../../NopeCHA")],
            args: [
                ...chromium.args, //
                "--disable-blink-features=AutomationControlled",
                "--disable-web-security",
            ],
        });
    }

    return browser;
}
