import mongoose from "mongoose";
import CookieModel from "../../models/cookieModel.js";
import { getBrowser } from "../../shared/browser.js";
import type { Cookie } from "puppeteer-core";
import fs from "fs";
import path from "path";
import os from "os";

export async function generateImage(prompt: string, images: string[]): Promise<string | { error: string; screenshot: string }> {
    const browser = await getBrowser();
    const page = await browser.newPage();
    const imagePaths: string[] = [];

    try {
        // Load cookies from database
        const cookieDoc = await CookieModel.findOne({ type: "google" });
        const cookies = cookieDoc ? JSON.parse(cookieDoc.cookies!) : [];
        await page.setCookie(...(cookies as Cookie[]));

        await page.goto("https://gemini.google.com");

        await page.waitForSelector('mat-icon[fonticon="add_2"]', { visible: true });
        await page.click('mat-icon[fonticon="add_2"]');

        // Save base64 images to temp files
        const tempDir = os.tmpdir();
        for (let i = 0; i < images.length; i++) {
            const base64 = images[i];
            const buffer = Buffer.from(base64.split(",")[1], "base64");
            const filePath = path.join(tempDir, `image_${i}.png`);
            fs.writeFileSync(filePath, buffer);
            imagePaths.push(filePath);
            console.log(`Saved image ${i} to ${filePath}, size: ${buffer.length}`);
        }

        if (await page.$eval('mat-icon[fonticon="attach_file"]', (e) => !e.checkVisibility())) {
            await page.click("text=Setuju");
        }

        const [fileChooser] = await Promise.all([page.waitForFileChooser(), page.click('mat-icon[fonticon="attach_file"]')]);
        console.log("Accepting files:", imagePaths);
        await fileChooser.accept([...imagePaths, "./example.png"]);
        console.log("Files accepted.");

        await page.type("rich-textarea", prompt);

        await page.waitForFunction(() => {
            const element = document.querySelector("div.mat-mdc-tooltip-trigger:nth-child(2)");
            return element && !element.classList.contains("disabled");
        });

        await page.keyboard.press("Enter");

        await page.waitForSelector('mat-icon[fonticon="send"]', { hidden: true });
        await page.waitForSelector('mat-icon[fonticon="mic"]', { visible: true, timeout: 120_000 });

        const base64 = await page.$eval("div.container img", async (e: any) => {
            const res = await fetch(e.src);
            const blob = await res.blob();

            return await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        });

        // Clean up temp files
        imagePaths.forEach(fs.unlinkSync);

        const acookies = await page.cookies();
        await CookieModel.findOneAndUpdate({ type: "google" }, { type: "google", cookies: JSON.stringify(acookies) }, { upsert: true });
        await browser.close();

        return base64;
    } catch (error) {
        const acookies = await page.cookies();
        await CookieModel.findOneAndUpdate({ type: "google" }, { type: "google", cookies: JSON.stringify(acookies) }, { upsert: true });

        console.error("Error:", error);
        // Clean up temp files on error
        imagePaths.forEach((filePath) => {
            try {
                fs.unlinkSync(filePath);
            } catch (e) {
                console.error(`Failed to clean up ${filePath}:`, e);
            }
        });
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
    }
}
