import { Page, BrowserContext } from 'puppeteer-core';
import { getBrowser } from '../lib/browser';
import path from 'path';
import fs from 'fs-extra';
import { Session } from '../models/Session'; // Import model Mongoose Anda

export interface GenerateWithPromptOptions {
    sessionId: string; // Tambahkan sessionId untuk mencari di DB
    imageBuffers: Buffer[];
    imageNames: string[];
    prompt: string;
}

/**
 * Service untuk process gambar menggunakan Puppeteer dengan Mongoose Session
 */
export class ImageService {
    private readonly richTextarea = 'rich-textarea';
    private readonly sendIconSelector = "mat-icon[fonticon='send']";
    private readonly responseImageSelector = 'model-response img';
    private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0';

    /**
     * Load cookies from Mongoose
     */
    private async loadCookiesFromDb(page: Page, sessionId: string): Promise<void> {
        try {
            const session = await Session.findOne({ id: sessionId });
            if (session && session.cookies) {
                const parsedCookies = typeof session.cookies === 'string' ? JSON.parse(session.cookies) : session.cookies;
                await page.setCookie(...parsedCookies);
                console.log(`✅ Cookies loaded from DB for: ${sessionId}`);
            }
        } catch (error) {
            console.warn('⚠️ Failed to load cookies from DB:', error);
        }
    }

    /**
     * Save cookies to Mongoose (Upsert/Update)
     */
    private async saveCookiesToDb(page: Page, sessionId: string): Promise<void> {
        try {
            const currentCookies = await page.cookies();
            await Session.findOneAndUpdate(
                { id: sessionId },
                {
                    cookies: JSON.stringify(currentCookies),
                    status: 'valid',
                },
                { upsert: true },
            );
            console.log(`✅ Cookies updated in DB for: ${sessionId}`);
        } catch (error) {
            console.warn('⚠️ Failed to save cookies to DB:', error);
        }
    }

    /**
     * Paste image buffer ke element menggunakan DataTransfer
     */
    private async pasteImageToElement(page: Page, imageBuffer: Buffer, fileName: string, selector: string): Promise<void> {
        await page.click(selector);

        await page.evaluate(
            (name: string, data: number[], sel: string) => {
                const blob = new Blob([new Uint8Array(data)], { type: 'image/jpeg' });
                const dt = new DataTransfer();
                dt.items.add(new File([blob], name, { type: 'image/jpeg' }));

                const event = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true });
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
                return images.some((img) => !!img.getAttribute('src'));
            },
            { timeout: 120000 },
            this.responseImageSelector,
        );

        return page.evaluate((sel: string) => {
            const images = Array.from(document.querySelectorAll(sel)) as HTMLImageElement[];
            const lastWithSrc = images.reverse().find((img) => !!img.getAttribute('src'));
            return lastWithSrc?.getAttribute('src') || null;
        }, this.responseImageSelector);
    }

    /**
     * Download image buffer from src
     */
    private async downloadImageBuffer(page: Page, imgSrc: string): Promise<Buffer> {
        if (imgSrc.startsWith('data:')) {
            const base64Data = imgSrc.split(',')[1];
            return Buffer.from(base64Data, 'base64');
        }

        try {
            const base64 = await page.evaluate(async (url: string) => {
                const res = await fetch(url, { credentials: 'include' });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const buf = await res.arrayBuffer();
                let binary = '';
                const bytes = new Uint8Array(buf);
                const len = bytes.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                return btoa(binary);
            }, imgSrc);

            return Buffer.from(base64, 'base64');
        } catch {
            const fetchPage = await page.browser().newPage();
            try {
                const response = await fetchPage.goto(imgSrc, { waitUntil: 'networkidle2', timeout: 60000 });
                if (!response) throw new Error('Failed to fetch image');
                return await response.buffer();
            } finally {
                await fetchPage.close();
            }
        }
    }

    /**
     * Process multiple images dengan Gemini menggunakan Browser Context & DB Session
     */
    async processWithGemini(options: GenerateWithPromptOptions): Promise<string> {
        const browser = await getBrowser();
        // Menggunakan Browser Context baru agar terisolasi
        const context = await browser.createBrowserContext();
        const page = await context.newPage();

        try {
            // Set User Agent
            await page.setUserAgent(this.userAgent);

            // Load cookies dari Mongoose
            await this.loadCookiesFromDb(page, options.sessionId);

            // Buka Gemini
            await page.goto('https://gemini.google.com/?hl=en', {
                waitUntil: 'networkidle2',
                timeout: 60000,
            });

            // Paste all images
            for (let i = 0; i < options.imageBuffers.length; i++) {
                await this.pasteImageToElement(page, options.imageBuffers[i], options.imageNames[i], this.richTextarea);
                // Beri sedikit delay antar paste jika banyak gambar
                await new Promise((r) => setTimeout(r, 500));
            }

            // Type prompt
            await page.click(this.richTextarea);
            await page.type(this.richTextarea, options.prompt);

            // Wait for spinner to be hidden
            await page.waitForSelector('mat-spinner', { hidden: true });

            // Submit
            await page.keyboard.press('Enter');

            // Wait for response ready
            await page.waitForSelector(this.sendIconSelector, { visible: true, timeout: 120000 });

            const imgSrc = await this.getLatestResponseImageSrc(page);

            if (!imgSrc) {
                throw new Error('No image found in Gemini response');
            }

            const imageBuffer = await this.downloadImageBuffer(page, imgSrc);
            const base64 = imageBuffer.toString('base64');

            return base64;
        } catch (error) {
            const screenshot = await page.screenshot({ encoding: 'base64' });
            const err = new Error(`Gemini processing failed: ${(error as Error).message}`);
            (err as any).screenshot = screenshot;
            throw err;
        } finally {
            // Update cookies ke DB setiap kali selesai (sukses/gagal)
            await this.saveCookiesToDb(page, options.sessionId);
            await page.close();
            await context.close(); // Tutup context
        }
    }
}

export const imageService = new ImageService();
