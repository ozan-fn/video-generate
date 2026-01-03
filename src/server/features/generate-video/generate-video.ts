import { getBrowser } from "../../shared/browser.js";
import mongoose from "mongoose";
import CookieModel from "../../models/cookieModel.js";
import type { Cookie } from "puppeteer-core";

export async function generateVideo(imagePath: string, prompt: string): Promise<string> {
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
        fileupload?.uploadFile(imagePath);

        await page.waitForSelector("textarea", { visible: true });
        await page.type("textarea", prompt);
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

        const acookies = await page.cookies();
        await CookieModel.findOneAndUpdate({ type: "grok" }, { type: "grok", cookies: JSON.stringify(acookies) }, { upsert: true });

        await browser.close();

        return videoSrc64;
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}
