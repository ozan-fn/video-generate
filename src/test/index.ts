import { newPage } from "../lib/browser";
import fs from "fs-extra";
import path from "path";

const cookiesPath = path.join(process.cwd(), "cookies", "meta", "cookies.json");

async function loadCookies(page: Awaited<ReturnType<typeof newPage>>): Promise<void> {
    try {
        if (await fs.pathExists(cookiesPath)) {
            const cookies = await fs.readJson(cookiesPath);
            await page.setCookie(...cookies);
            console.log("✅ Meta cookies loaded");
        }
    } catch (error) {
        console.warn("⚠️ Failed to load Meta cookies:", error);
    }
}

async function saveCookies(page: Awaited<ReturnType<typeof newPage>>): Promise<void> {
    try {
        const cookies = await page.cookies();
        await fs.ensureDir(path.dirname(cookiesPath));
        await fs.writeJson(cookiesPath, cookies, { spaces: 2 });
        console.log("✅ Meta cookies saved");
    } catch (error) {
        console.warn("⚠️ Failed to save Meta cookies:", error);
    }
}

async function pasteImagesToElement(page: Awaited<ReturnType<typeof newPage>>, images: Array<{ buffer: Buffer; name: string }>, selector: string): Promise<void> {
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

async function main() {
    const page = await newPage();
    try {
        await loadCookies(page);
        await page.goto("https://www.meta.ai/?nr=1");
        const editorSelector = 'div[contenteditable="true"]';
        await page.click(editorSelector);

        const imagePaths: string[] = [
            "src/test/5fe8f59b36d7982da0917032f9b79893.jpg", //
            "src/test/1270716-meme-lucu-kucing-lagi-emosi.jpg",
        ];

        if (imagePaths.length === 0) {
            console.warn("⚠️ No image paths provided. Add file paths to imagePaths array.");
        }

        const images = await Promise.all(
            imagePaths.map(async (imagePath) => ({
                buffer: await fs.readFile(imagePath),
                name: path.basename(imagePath),
            })),
        );

        if (images.length > 0) {
            await pasteImagesToElement(page, images, editorSelector);
        }

        const prompt = "Create a video of two cats playing together in a magical forest with glowing lights";
        await page.type(editorSelector, prompt);

        await page.waitForSelector('svg[aria-label="Loading..."]', { hidden: true, timeout: 120000 });
        console.log("✅ Loading complete");

        await page.keyboard.press("Enter");
        console.log("✅ Enter pressed");

        await page.waitForSelector('svg[aria-labelledby="progress-ring"]', { visible: true, timeout: 120000 });
        console.log("✅ Progress ring visible");

        await page.waitForSelector('svg[aria-labelledby="progress-ring"]', { hidden: true, timeout: 300000 });
        console.log("✅ Progress ring hidden - video generation complete");

        const videoSelector = "video";
        await page.waitForSelector(videoSelector, { visible: true, timeout: 120000 });
        await page.click(videoSelector);
        console.log("✅ Video clicked");

        const videoSrc = await page.$eval(videoSelector, (el) => (el as HTMLVideoElement).getAttribute("src"));
        console.log("🎬 Video src:", videoSrc);
    } finally {
        await saveCookies(page);
        // await page.close();
    }
}

main();
