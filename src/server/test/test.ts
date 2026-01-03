import { config } from "dotenv";
config({ override: true });

import mongoose from "mongoose";
import CookieModel from "../models/cookieModel.js";
import { getBrowser } from "../shared/browser.js";
import type { Cookie } from "puppeteer-core";

(async () => {
    console.log("Starting test script...");

    console.log("Connecting to database...");
    await mongoose.connect(process.env.DATABASE_URL!);
    console.log("Connected to database.");

    console.log("Launching browser...");
    const browser = await getBrowser();
    console.log("Browser launched.");

    const page = await browser.newPage();
    console.log("New page created.");

    // Load cookies from database
    console.log("Loading cookies from database...");
    const cookieDoc = await CookieModel.findOne({ type: "google" });
    const cookies = cookieDoc ? JSON.parse(cookieDoc.cookies!) : [];
    console.log("Loaded", cookies.length, "cookies.");

    console.log("Setting cookies...");
    await page.setCookie(...(cookies as Cookie[]));
    console.log("Cookies set.");

    console.log("Navigating to Gemini...");
    await page.goto("https://gemini.google.com", { timeout: 300_000 });
    console.log("Navigated to Gemini.");

    console.log("Waiting for add_2 selector...");
    await page.waitForSelector('mat-icon[fonticon="add_2"]', { visible: true });
    console.log("Clicking add_2...");
    await page.click('mat-icon[fonticon="add_2"]');

    const [fileChooser] = await Promise.all([
        page.waitForFileChooser(), //
        page.click('mat-icon[fonticon="attach_file"]'),
    ]);
    console.log("Accepting files: ./test1.jpg, ./test2.jpg");
    await fileChooser.accept(["./test1.jpg", "./test2.jpg"]);

    console.log("Typing prompt...");
    await page.type("rich-textarea", "editkan gambar agar gambar ini menyatu dengan model menggunakan nano banana");

    console.log("Waiting for send button to be enabled...");
    await page.waitForFunction(() => {
        const element = document.querySelector("div.mat-mdc-tooltip-trigger:nth-child(2)");
        return element && !element.classList.contains("disabled");
    });

    console.log("Pressing Enter...");
    await page.keyboard.press("Enter");

    console.log("Waiting for send icon to be hidden...");
    await page.waitForSelector('mat-icon[fonticon="send"]', { hidden: true });
    console.log("Waiting for mic icon to be visible...");
    await page.waitForSelector('mat-icon[fonticon="mic"]', { visible: true, timeout: 120_000 });
    console.log("Generation complete, extracting image...");

    const base64 = await page.$eval("div.container img", async (e) => {
        const res = await fetch(e.src);
        const blob = await res.blob();

        return await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    });
    console.log("Image extracted, base64 length:", base64.length);

    console.log("Updating cookies in database...");
    const acookies = await page.cookies();
    await CookieModel.findOneAndUpdate({ type: "google" }, { type: "google", cookies: JSON.stringify(acookies) }, { upsert: true });
    console.log("Cookies updated.");

    console.log("Closing browser...");
    await browser.close();
    console.log("Browser closed.");

    console.log("Disconnecting from database...");
    await mongoose.disconnect();
    console.log("Disconnected from database.");

    console.log("Test script completed.");
})();
