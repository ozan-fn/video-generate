import { Page, BrowserContext } from 'puppeteer-core';
import { getBrowser } from '../lib/browser';
import path from 'path';
import fs from 'fs-extra';
import { Session } from '../models/Session'; // Pastikan path model sesuai

export interface GenerateWithPromptOptions {
    imageBuffers: Buffer[];
    imageNames: string[];
    prompt: string;
}

/**
 * Service untuk process gambar menggunakan Puppeteer dengan Random Mongoose Session
 */
export class ImageService {
    private readonly richTextarea = 'rich-textarea';
    private readonly sendIconSelector = "mat-icon[fonticon='send']";
    private readonly responseImageSelector = 'model-response img';
    private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0';

    /**
     * Mengambil satu session secara random dari database yang berstatus 'valid'
     */
    private async getRandomValidSession() {
        try {
            // Menggunakan agregasi MongoDB untuk mengambil 1 dokumen secara acak
            const sessions = await Session.aggregate([{ $match: { status: 'valid' } }, { $sample: { size: 1 } }]);

            if (sessions.length === 0) {
                throw new Error('No valid sessions found in database');
            }

            return sessions[0];
        } catch (error) {
            console.error('❌ Error fetching random session:', error);
            throw error;
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
                const element = document.querySelector(sel);
                if (element) {
                    element.dispatchEvent(event);
                }
            },
            fileName,
            Array.from(imageBuffer),
            selector,
        );
    }

    /**
     * Tunggu sampai gambar respon tersedia
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
     * Download gambar hasil generate
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
     * Main process dengan Gemini
     */
    async processWithGemini(options: GenerateWithPromptOptions): Promise<string> {
        const browser = await getBrowser();
        const context = await browser.createBrowserContext();
        const page = await context.newPage();

        // 1. Ambil session secara random dari DB
        const sessionDb = await this.getRandomValidSession();
        const sessionId = sessionDb.id;

        try {
            await page.setUserAgent(this.userAgent);

            // 2. Set Cookies dari session yang terpilih
            if (sessionDb.cookies) {
                const parsedCookies = typeof sessionDb.cookies === 'string' ? JSON.parse(sessionDb.cookies) : sessionDb.cookies;
                await page.setCookie(...parsedCookies);
                console.log(`🎲 Using random session: ${sessionId}`);
            }

            await page.goto('https://gemini.google.com/?hl=en', {
                waitUntil: 'networkidle2',
                timeout: 60000,
            });

            // 3. Paste Images
            for (let i = 0; i < options.imageBuffers.length; i++) {
                await this.pasteImageToElement(page, options.imageBuffers[i], options.imageNames[i], this.richTextarea);
                await new Promise((r) => setTimeout(r, 800)); // Jeda antar paste
            }

            // 4. Type Prompt & Submit
            await page.click(this.richTextarea);
            await page.type(this.richTextarea, options.prompt);
            await page.waitForSelector('mat-spinner', { hidden: true });
            await page.keyboard.press('Enter');

            // 5. Wait for Response
            await page.waitForSelector(this.sendIconSelector, { visible: true, timeout: 120000 });

            const imgSrc = await this.getLatestResponseImageSrc(page);
            if (!imgSrc) throw new Error('No image found in Gemini response');

            const imageBuffer = await this.downloadImageBuffer(page, imgSrc);

            // 6. Update Cookies Terbaru ke DB (Upsert)
            const currentCookies = await page.cookies();
            await Session.findOneAndUpdate({ id: sessionId }, { cookies: JSON.stringify(currentCookies), status: 'valid' }, { upsert: true });

            return imageBuffer.toString('base64');
        } catch (error) {
            const screenshot = await page.screenshot({ encoding: 'base64' });
            console.error(`❌ Process failed for ${sessionId}:`, (error as Error).message);

            const err = new Error(`Gemini processing failed: ${(error as Error).message}`);
            (err as any).screenshot = screenshot;
            throw err;
        } finally {
            await page.close();
            await context.close();
        }
    }
}

export const imageService = new ImageService();
