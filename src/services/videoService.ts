import { newPage } from "../lib/browser";
import path from "path";
import fs from "fs-extra";

export interface GenerateVideoOptions {
    prompt: string;
    files: Express.Multer.File[];
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

    async generateFromImages(options: GenerateVideoOptions) {
        const { prompt, files } = options;
        const image1 = files[0];
        const image2 = files[1] ?? files[0];

        const page = await newPage();
        try {
            await this.loadCookies(page);
            await page.goto("https://www.meta.ai/?nr=1");

            // TODO: implement upload images and prompt handling using image1/image2 and prompt
            void image1;
            void image2;
            void prompt;
        } finally {
            await this.saveCookies(page);
            await page.close();
        }
    }
}

export const videoService = new VideoService();
