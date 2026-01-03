import { config } from "dotenv";
config();

import { getBrowser } from "../shared/browser.js";
import mongoose from "mongoose";
import CookieModel from "../models/cookieModel.js";
import type { Cookie } from "puppeteer-core";

(async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL!);

        const browser = await getBrowser();
        const page = await browser.newPage();

        // Load cookies from database
        const cookieDoc = await CookieModel.findOne({ type: "grok" });
        const cookies = cookieDoc ? JSON.parse(cookieDoc.cookies!) : [];
        await page.setCookie(...(cookies as Cookie[]));

        await page.goto("https://grok.com/imagine");

        const fileupload = await page.waitForSelector('input[type="file"]');
        fileupload?.uploadFile("./test1.jpg");

        await page.waitForSelector("textarea", { visible: true });
        await page.type("textarea", "make 1 video 10 seconds anything awesome");
        await page.keyboard.press("Enter");

        await page.waitForSelector('video[id="sd-video"]', { visible: true, timeout: 120_000 });

        const videoSrc64 = await page.$eval('video[id="sd-video"]', async (e) => {
            const res = await fetch(e.src);
            const blob = await res.blob();

            return await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        });

        console.log("Generated video (base64):", videoSrc64.length);

        const acookies = await page.cookies();
        await CookieModel.findOneAndUpdate({ type: "grok" }, { type: "grok", cookies: JSON.stringify(acookies) }, { upsert: true });

        // await browser.close();
    } catch (error) {
        console.error("Error:", error);
    }
})();
