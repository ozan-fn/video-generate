import { config } from "dotenv";
config();

import { getBrowser } from "../shared/browser.js";
import mongoose from "mongoose";
import CookieModel from "../models/cookieModel.js";

(async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL!);

        const browser = await getBrowser();

        const page = await browser.newPage();
        await page.goto("https://gemini.google.com/app");

        if (await page.$('a[aria-label="Sign in"]')) {
            await page.click('a[aria-label="Sign in"]');
        }
        await page.waitForSelector(".textarea", { timeout: 0, visible: true });
        const cookies = await page.cookies();
        await CookieModel.findOneAndUpdate({}, { cookies: JSON.stringify(cookies) }, { upsert: true });

        await browser.close();
        await mongoose.disconnect();
    } catch (error) {}
})();
