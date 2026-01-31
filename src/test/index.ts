import { getBrowser, closeBrowser } from "../lib/browser";
import fs from "fs-extra";
import path from "path";

async function pasteImageToElement(page: any, imagePath: string, selector: string) {
  const imageBuffer = await fs.readFile(imagePath);
  const fileName = path.basename(imagePath);

  await page.click(selector);
  await new Promise((r) => setTimeout(r, 300));

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

async function testGemini() {
  console.log("🚀 Opening Gemini...");

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();

    // Load cookies
    const cookiesPath = path.join(process.cwd(), "cookies", "gemini.json");
    if (await fs.pathExists(cookiesPath)) {
      const cookies = await fs.readJson(cookiesPath);
      await page.setCookie(...cookies);
      console.log("✅ Cookies loaded");
    }

    // Navigate
    await page.goto("https://gemini.google.com/?hl=en", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    console.log("✅ Page loaded");

    // Get images and paste
    const testDir = path.join(process.cwd(), "src", "test");
    const imageFiles = (await fs.readdir(testDir)).filter((f) => /\.(jpg|jpeg|png|gif)$/i.test(f));

    console.log(`📁 Found ${imageFiles.length} images`);

    for (const img of imageFiles.slice(0, 2)) {
      console.log(`📷 Pasting: ${img}`);
      await pasteImageToElement(page, path.join(testDir, img), "rich-textarea");
    }

    // Save cookies
    const cookies = await page.cookies();
    await fs.ensureDir(path.join(process.cwd(), "cookies"));
    await fs.writeJson(path.join(process.cwd(), "cookies", "gemini.json"), cookies, {
      spaces: 2,
    });

    console.log("✅ Done");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    // await closeBrowser();
  }
}

testGemini();
