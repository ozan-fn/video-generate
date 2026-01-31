import { Page } from "puppeteer-core";
import { getBrowser } from "../lib/browser";
import path from "path";
import fs from "fs-extra";

export interface GenerateWithPromptOptions {
  image1Path: string;
  image2Path: string;
  prompt: string;
  outputPath: string;
}

/**
 * Service untuk process gambar menggunakan Puppeteer
 */
export class ImageService {
  /**
   * Copy image to clipboard dan paste ke Gemini
   */
  private async pasteImageToGemini(page: Page, imagePath: string): Promise<void> {
    // Read image file
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString("base64");
    const mimeType = imagePath.endsWith(".png") ? "image/png" : "image/jpeg";

    // Set clipboard dengan image
    await page.evaluate(
      async (base64, mime) => {
        const response = await fetch(`data:${mime};base64,${base64}`);
        const blob = await response.blob();
        const item = new ClipboardItem({ [mime]: blob });
        await navigator.clipboard.write([item]);
      },
      base64Image,
      mimeType,
    );

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Focus ke area input dan paste
    await page.click('div[contenteditable="true"]');
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Paste (Ctrl+V)
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyV");
    await page.keyboard.up("Control");

    // Wait untuk upload selesai
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  /**
   * Process 2 images dengan Gemini
   */
  async processWithGemini(options: GenerateWithPromptOptions): Promise<string> {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
      // Buka Gemini
      await page.goto("https://gemini.google.com/?hl=en", {
        waitUntil: "networkidle0",
        timeout: 60000,
      });

      // Wait for page to load
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Paste gambar pertama
      await this.pasteImageToGemini(page, path.resolve(options.image1Path));

      // Paste gambar kedua
      await this.pasteImageToGemini(page, path.resolve(options.image2Path));

      // Find prompt input and type
      const promptSelector = 'div[contenteditable="true"]';
      await page.waitForSelector(promptSelector, { timeout: 10000 });

      // Clear any existing text and type prompt
      await page.click(promptSelector);
      await page.keyboard.down("Control");
      await page.keyboard.press("KeyA");
      await page.keyboard.up("Control");
      await page.type(promptSelector, options.prompt);

      // Submit (press Enter)
      await page.keyboard.press("Enter");

      // Wait for response
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Screenshot result
      await page.screenshot({
        path: options.outputPath,
        fullPage: true,
      });

      await page.close();

      return options.outputPath;
    } catch (error) {
      await page.close();
      throw error;
    }
  }
}

// Export singleton instance
export const imageService = new ImageService();
