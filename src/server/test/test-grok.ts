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
        await page.goto("https://grok.com");

        if (await page.$('a[href="/sign-in"]')) {
            await page.click('a[href="/sign-in"]');
        }

        await page.waitForSelector("img[alt='pfp']", { timeout: 0 });

        const cookies = await page.cookies();
        await CookieModel.findOneAndUpdate({ type: "grok" }, { type: "grok", cookies: JSON.stringify(cookies) }, { upsert: true });

        await browser.close();
        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
})();
