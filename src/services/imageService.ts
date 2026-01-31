import { Page } from "puppeteer-core";
import { getBrowser } from "../lib/browser";
import path from "path";

export interface GenerateWithPromptOptions {
  image1Buffer: Buffer;
  image2Buffer: Buffer;
  image1Name: string;
  image2Name: string;
  prompt: string;
}

/**
 * Service untuk process gambar menggunakan Puppeteer
 */
export class ImageService {
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
   * Process 2 images dengan Gemini
   */
  async processWithGemini(options: GenerateWithPromptOptions): Promise<string> {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
      // Buka Gemini
      await page.goto("https://gemini.google.com/?hl=en", {
        waitUntil: "networkidle2",
        timeout: 60000,
      });

      // Paste gambar pertama
      await this.pasteImageToElement(page, options.image1Buffer, options.image1Name, "rich-textarea");

      // Paste gambar kedua
      await this.pasteImageToElement(page, options.image2Buffer, options.image2Name, "rich-textarea");

      // Type prompt
      await page.click("rich-textarea");
      await page.type("rich-textarea", options.prompt);

      // Wait for spinner to be hidden (ready to submit)
      await page.waitForSelector("mat-spinner", { hidden: true });

      // Submit (press Enter)
      await page.keyboard.press("Enter");

      // Screenshot as buffer and return base64
      const screenshot = (await page.screenshot()) as Buffer;
      const base64 = screenshot.toString("base64");

      await page.close();

      return base64;
    } catch (error) {
      await page.close();
      throw error;
    }
  }
}

// Export singleton instance
export const imageService = new ImageService();
