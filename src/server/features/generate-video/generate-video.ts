import { getBrowser } from "../../shared/browser.js";
import mongoose from "mongoose";
import CookieModel from "../../models/cookieModel.js";
import type { Cookie, Page } from "puppeteer-core";
import fs from "fs";
import path from "path";
import os from "os";

export async function generateVideo(imageBuffer: Buffer, prompt: string): Promise<string | { error: string; screenshot: string }> {
    let browser = await getBrowser();
    let page = await browser.newPage();
    let imagePath = "";
    await mongoose.connect(process.env.DATABASE_URL!);

    try {
        // Load cookies from database
        const cookieDoc = await CookieModel.findOne({ type: "grok" });
        const cookies = cookieDoc ? JSON.parse(cookieDoc.cookies!) : [];
        await page.setCookie(...(cookies as Cookie[]));
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 OPR/124.0.0.0");

        // Create temp file from buffer
        const tempDir = os.tmpdir();
        imagePath = path.join(tempDir, `image_${Date.now()}.png`);
        fs.writeFileSync(imagePath, imageBuffer);

        await page.goto("https://grok.com/imagine");

        const fileupload = await page.waitForSelector('input[type="file"]');
        fileupload?.uploadFile(imagePath);

        await page.waitForSelector("textarea", { visible: true });
        await page.type("textarea", prompt);
        await page.keyboard.press("Enter");

        await page.waitForSelector('video[id="sd-video"]', { visible: true, timeout: 120_000 });

        const videoSrc64 = await page.$eval('video[id="sd-video"]', async (e: any) => {
            const res = await fetch(e.src);
            const blob = await res.blob();

            return await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        });

        // Clean up temp file
        fs.unlinkSync(imagePath);

        return videoSrc64;
    } catch (error) {
        console.error("Error:", error);
        // Clean up temp file on error
        if (imagePath) {
            try {
                fs.unlinkSync(imagePath);
            } catch (e) {
                console.error(`Failed to clean up ${imagePath}:`, e);
            }
        }
        // Capture screenshot on error
        let screenshot: string | null = null;
        try {
            if (page) {
                const screenshotBuffer = await page.screenshot({ encoding: "base64" });
                screenshot = `data:image/png;base64,${screenshotBuffer}`;
            }
        } catch (screenshotError) {
            console.error("Failed to capture screenshot:", screenshotError);
        } finally {
            if (browser) {
                try {
                    await browser.close();
                } catch (closeError) {
                    console.error("Failed to close browser:", closeError);
                }
            }
        }
        throw { error: error instanceof Error ? error.message : "Unknown error", screenshot };
    } finally {
        const acookies = await page.cookies();
        await CookieModel.findOneAndUpdate({ type: "grok" }, { type: "grok", cookies: JSON.stringify(acookies) }, { upsert: true });

        await browser.close();
    }
}
