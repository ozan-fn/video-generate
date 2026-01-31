import { newPage } from "../lib/browser";
import path from "path";
import fs from "fs-extra";
import axios from "axios";

export interface GenerateVideoOptions {
    prompt: string;
    files: Express.Multer.File[];
}

export interface GenerateVideoFromVideoOptions {
    prompt: string;
    urlHistory: string;
}

export interface GenerateVideoResult {
    videoPath: string;
    videoUrl: string;
    urlHistory?: string;
    images?: Array<{ name: string; size: number }>;
}

export class VideoService {
    private cookiesPath = path.join(process.cwd(), "cookies", "meta", "cookies.json");

    private async loadCookies(page: Awaited<ReturnType<typeof newPage>>): Promise<void> {
        try {
            if (await fs.pathExists(this.cookiesPath)) {
                const cookies = await fs.readJson(this.cookiesPath);
                await page.setCookie(...cookies);
                console.log("✅ Meta cookies loaded");
            }
        } catch (error) {
            console.warn("⚠️ Failed to load Meta cookies:", error);
        }
    }

    private async saveCookies(page: Awaited<ReturnType<typeof newPage>>): Promise<void> {
        try {
            const cookies = await page.cookies();
            await fs.ensureDir(path.dirname(this.cookiesPath));
            await fs.writeJson(this.cookiesPath, cookies, { spaces: 2 });
            console.log("✅ Meta cookies saved");
        } catch (error) {
            console.warn("⚠️ Failed to save Meta cookies:", error);
        }
    }

    private async pasteImagesToElement(page: Awaited<ReturnType<typeof newPage>>, images: Array<{ buffer: Buffer; name: string }>, selector: string): Promise<void> {
        await page.click(selector);

        await page.evaluate(
            (items: Array<{ name: string; data: number[] }>, sel: string) => {
                const dt = new DataTransfer();
                for (const item of items) {
                    const blob = new Blob([new Uint8Array(item.data)], { type: "image/jpeg" });
                    dt.items.add(new File([blob], item.name, { type: "image/jpeg" }));
                }

                const event = new ClipboardEvent("paste", { clipboardData: dt, bubbles: true });
                document.querySelector(sel)?.dispatchEvent(event);
            },
            images.map((img) => ({ name: img.name, data: Array.from(img.buffer) })),
            selector,
        );
    }

    private async downloadVideoBuffer(videoSrc: string, cookieHeader?: string): Promise<Buffer> {
        if (videoSrc.startsWith("data:")) {
            const base64Data = videoSrc.split(",")[1];
            return Buffer.from(base64Data, "base64");
        }
        if (videoSrc.startsWith("blob:")) {
            throw new Error("Video src is blob URL and requires resolved media URL");
        }
        const url = new URL(videoSrc);
        const response = await axios.get<ArrayBuffer>(url.toString(), {
            responseType: "arraybuffer",
            headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
        });

        return Buffer.from(response.data);
    }

    private resolveVideoUrl(videoSrc: string, latestMediaUrl: string | null): string {
        if (!videoSrc.startsWith("blob:")) {
            return videoSrc;
        }

        if (!latestMediaUrl) {
            throw new Error("Video src is blob URL and media URL was not captured");
        }

        return latestMediaUrl;
    }

    async generateFromImages(options: GenerateVideoOptions): Promise<GenerateVideoResult> {
        const { prompt, files } = options;
        const images = files.map((file) => ({
            buffer: file.buffer,
            name: file.originalname,
            size: file.size,
        }));

        const page = await newPage();
        let latestMediaUrl: string | null = null;
        const onResponse = (res: Awaited<ReturnType<typeof page.waitForResponse>>) => {
            try {
                const contentType = res.headers()["content-type"] || "";
                if (contentType.startsWith("video/")) {
                    latestMediaUrl = res.url();
                }
            } catch {
                // ignore
            }
        };
        page.on("response", onResponse);
        try {
            await this.loadCookies(page);
            await page.goto("https://www.meta.ai/?nr=1");

            const editorSelector = 'div[contenteditable="true"]';
            await page.click(editorSelector);

            if (images.length > 0) {
                await this.pasteImagesToElement(page, images, editorSelector);
            }

            await page.type(editorSelector, prompt);

            await page.waitForSelector('svg[aria-label="Loading..."]', { hidden: true, timeout: 120000 });
            await page.keyboard.press("Enter");

            await page.waitForSelector('svg[aria-labelledby="progress-ring"]', { visible: true, timeout: 120000 });
            await page.waitForSelector('svg[aria-labelledby="progress-ring"]', { hidden: true, timeout: 300000 });
            const urlHistory = await page.url();
            const videoSelector = 'div[aria-label="Image generated by Meta AI"]';
            await page.waitForSelector(videoSelector, { visible: true, timeout: 120000 });
            const videos = await page.$$(videoSelector);
            if (videos.length === 0) {
                throw new Error("Video element not found");
            }
            await videos[videos.length - 1].click();

            await page.waitForSelector('video[src^="https://scontent"][playsinline]', { visible: true, timeout: 120000 });
            const videoSrc = await page.$eval('video[src^="https://scontent"][playsinline]', (el) => (el as unknown as HTMLVideoElement).getAttribute("src"));
            if (!videoSrc) {
                throw new Error("Video src not found");
            }

            const resolvedVideoUrl = this.resolveVideoUrl(videoSrc, latestMediaUrl);
            const cookieHeader = (await page.cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
            const videoBuffer = await this.downloadVideoBuffer(resolvedVideoUrl, cookieHeader);
            const storageDir = path.join(process.cwd(), "storages");
            await fs.ensureDir(storageDir);
            const filename = `video-${Date.now()}.mp4`;
            const videoPath = path.join(storageDir, filename);
            await fs.writeFile(videoPath, videoBuffer);
            const videoUrl = `/storages/${filename}`;

            console.log(urlHistory);
            return {
                videoPath,
                videoUrl,
                urlHistory,
                images: images.map((img) => ({ name: img.name, size: img.size })),
            };
        } catch (error) {
            const screenshot = await page.screenshot({ encoding: "base64" });
            const err = new Error(error instanceof Error ? error.message : "Video generation failed");
            (err as Error & { screenshot?: string }).screenshot = screenshot;
            throw err;
        } finally {
            page.off("response", onResponse);
            await this.saveCookies(page);
            await page.close();
        }
    }

    async generateFromVideoAndPrompt(options: GenerateVideoFromVideoOptions): Promise<GenerateVideoResult> {
        const { prompt, urlHistory } = options;

        const page = await newPage();
        let latestMediaUrl: string | null = null;
        const onResponse = (res: Awaited<ReturnType<typeof page.waitForResponse>>) => {
            try {
                const contentType = res.headers()["content-type"] || "";
                if (contentType.startsWith("video/")) {
                    latestMediaUrl = res.url();
                }
            } catch {
                // ignore
            }
        };
        page.on("response", onResponse);
        try {
            await this.loadCookies(page);
            await page.goto(urlHistory);

            const editorSelector = 'div[contenteditable="true"]';
            await page.click(editorSelector);

            // Type prompt
            await page.type(editorSelector, prompt);

            await page.waitForSelector('svg[aria-label="Loading..."]', { hidden: true, timeout: 120000 });
            await page.keyboard.press("Enter");

            await page.waitForSelector('svg[aria-labelledby="progress-ring"]', { visible: true, timeout: 120000 });
            await page.waitForSelector('svg[aria-labelledby="progress-ring"]', { hidden: true, timeout: 300000 });

            const nextUrlHistory = await page.url();

            const videoSelector = 'div[aria-label="Image generated by Meta AI"]';
            await page.waitForSelector(videoSelector, { visible: true, timeout: 120000 });
            const videos = await page.$$(videoSelector);
            if (videos.length === 0) {
                throw new Error("Video element not found");
            }
            await videos[videos.length - 1].click();

            await page.waitForSelector('video[src^="https://scontent"][playsinline]', { visible: true, timeout: 120000 });
            const videoSrc = await page.$eval('video[src^="https://scontent"][playsinline]', (el) => (el as unknown as HTMLVideoElement).getAttribute("src"));
            if (!videoSrc) {
                throw new Error("Video src not found");
            }

            const resolvedVideoUrl = this.resolveVideoUrl(videoSrc, latestMediaUrl);
            const cookieHeader = (await page.cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
            const resultVideoBuffer = await this.downloadVideoBuffer(resolvedVideoUrl, cookieHeader);
            const storageDir = path.join(process.cwd(), "storages");
            await fs.ensureDir(storageDir);
            const filename = `video-${Date.now()}.mp4`;
            const videoPath = path.join(storageDir, filename);
            await fs.writeFile(videoPath, resultVideoBuffer);
            const videoUrl = `/storages/${filename}`;

            return {
                videoPath,
                videoUrl,
                urlHistory: nextUrlHistory,
            };
        } catch (error) {
            const screenshot = await page.screenshot({ encoding: "base64" });
            const err = new Error(error instanceof Error ? error.message : "Video generation failed");
            (err as Error & { screenshot?: string }).screenshot = screenshot;
            throw err;
        } finally {
            page.off("response", onResponse);
            await this.saveCookies(page);
            await page.close();
        }
    }
}

export const videoService = new VideoService();
