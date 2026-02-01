import { Page } from "puppeteer-core";
import { getBrowser } from "../lib/browser";
import path from "path";
import fs from "fs-extra";

export interface GenerateWithPromptOptions {
    imageBuffers: Buffer[];
    imageNames: string[];
    prompt: string;
}

/**
 * Service untuk process gambar menggunakan Puppeteer
 */
export class ImageService {
    private cookiesPath = path.join(process.cwd(), "cookies", "gemini.json");
    private readonly richTextarea = "rich-textarea";
    private readonly sendIconSelector = "mat-icon[fonticon='send']";
    private readonly responseImageSelector = "model-response img";

    /**
     * Load cookies from file
     */
    private async loadCookies(page: Page): Promise<void> {
        try {
            if (await fs.pathExists(this.cookiesPath)) {
                const cookies = await fs.readJson(this.cookiesPath);
                await page.setCookie(...cookies);
                console.log("✅ Cookies loaded");
            }
        } catch (error) {
            console.warn("⚠️ Failed to load cookies:", error);
        }
    }

    /**
     * Save cookies to file
     */
    private async saveCookies(page: Page): Promise<void> {
        try {
            const cookies = await page.cookies();
            await fs.ensureDir(path.dirname(this.cookiesPath));
            await fs.writeJson(this.cookiesPath, cookies, { spaces: 2 });
            console.log("✅ Cookies saved");
        } catch (error) {
            console.warn("⚠️ Failed to save cookies:", error);
        }
    }

    /**
     * Paste image buffer ke element menggunakan DataTransfer
     */
    private async pasteImageToElement(page: Page, imageBuffer: Buffer, fileName: string, selector: string): Promise<void> {
        await page.click(selector);

        await page.evaluate(
            (name: string, data: number[], sel: string) => {
                const blob = new Blob([new Uint8Array(data)], { type: "image/jpeg" });
                const dt = new DataTransfer();
                dt.items.add(new File([blob], name, { type: "image/jpeg" }));

                const event = new ClipboardEvent("paste", { clipboardData: dt, bubbles: true });
                document.querySelector(sel)?.dispatchEvent(event);
            },
            fileName,
            Array.from(imageBuffer),
            selector,
        );
    }

    /**
     * Wait until a response image is available and return the latest src
     */
    private async getLatestResponseImageSrc(page: Page): Promise<string | null> {
        await page.waitForFunction(
            (sel: string) => {
                const images = Array.from(document.querySelectorAll(sel));
                return images.some((img) => !!img.getAttribute("src"));
            },
            { timeout: 120000 },
            this.responseImageSelector,
        );

        return page.evaluate((sel: string) => {
            const images = Array.from(document.querySelectorAll(sel)) as HTMLImageElement[];
            const lastWithSrc = images.reverse().find((img) => !!img.getAttribute("src"));
            return lastWithSrc?.getAttribute("src") || null;
        }, this.responseImageSelector);
    }

    /**
     * Download image buffer from src without leaving the page
     */
    private async downloadImageBuffer(page: Page, imgSrc: string): Promise<Buffer> {
        if (imgSrc.startsWith("data:")) {
            const base64Data = imgSrc.split(",")[1];
            return Buffer.from(base64Data, "base64");
        }

        try {
            const base64 = await page.evaluate(async (url: string) => {
                const res = await fetch(url, { credentials: "include" });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const buf = await res.arrayBuffer();
                let binary = "";
                const bytes = new Uint8Array(buf);
                const len = bytes.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                return btoa(binary);
            }, imgSrc);

            return Buffer.from(base64, "base64");
        } catch {
            const fetchPage = await page.browser().newPage();
            try {
                const response = await fetchPage.goto(imgSrc, { waitUntil: "networkidle2", timeout: 60000 });
                if (!response) {
                    throw new Error("Failed to fetch image");
                }
                return await response.buffer();
            } finally {
                await fetchPage.close();
            }
        }
    }

    /**
     * Process multiple images (1-5) dengan Gemini
     */
    async processWithGemini(options: GenerateWithPromptOptions): Promise<string> {
        const browser = await getBrowser();
        const page = await browser.newPage();

        try {
            // Load cookies
            await this.loadCookies(page);
            await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 OPR/126.0.0.0");

            // Buka Gemini
            await page.goto("https://gemini.google.com/?hl=en", {
                waitUntil: "networkidle2",
                timeout: 60000,
            });

            // Paste all images
            for (let i = 0; i < options.imageBuffers.length; i++) {
                await this.pasteImageToElement(page, options.imageBuffers[i], options.imageNames[i], this.richTextarea);
            }

            // Type prompt
            await page.click(this.richTextarea);
            await page.type("rich-textarea", options.prompt);

            // Wait for spinner to be hidden (ready to submit)
            await page.waitForSelector("mat-spinner", { hidden: true });

            // Submit (press Enter)
            await page.keyboard.press("Enter");

            // Wait for send button to be visible again (response ready)
            await page.waitForSelector(this.sendIconSelector, { visible: true, timeout: 120000 });

            const imgSrc = await this.getLatestResponseImageSrc(page);

            if (!imgSrc) {
                throw new Error("No image found in Gemini response");
            }

            const imageBuffer = await this.downloadImageBuffer(page, imgSrc);
            const base64 = imageBuffer.toString("base64");

            return base64;
        } catch (error) {
            const screenshot = await page.screenshot({ encoding: "base64" });
            const err = new Error("Gemini processing failed");
            (err as Error & { screenshot?: string }).screenshot = screenshot;
            throw err;
        } finally {
            // Save cookies even on error
            await this.saveCookies(page);
            await page.close();
        }
    }
}

// Export singleton instance
export const imageService = new ImageService();
