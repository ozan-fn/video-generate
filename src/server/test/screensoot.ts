import puppeteer from "puppeteer-core";
import "dotenv/config";
import { getBrowser } from "../shared/browser";

(async () => {
    const browser = await getBrowser();

    const page = await browser.newPage();
    await page.goto("https://example.com");

    await page.screenshot();
    console.log("Screenshot taken!");

    // await browser.close();
})();
