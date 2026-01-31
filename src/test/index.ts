import { getBrowser, closeBrowser } from "../lib/browser";
import fs from "fs-extra";
import path from "path";

async function testGemini() {
  console.log("Opening Gemini...");

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();

    // Load cookies if exists
    const cookiesPath = path.join(process.cwd(), "cookies", "gemini.json");
    if (await fs.pathExists(cookiesPath)) {
      const cookies = await fs.readJson(cookiesPath);
      await page.setCookie(...cookies);
      console.log("✅ Cookies loaded from gemini.json");
    }

    // Buka halaman Gemini
    await page.goto("https://gemini.google.com/?hl=en", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    console.log("✅ Gemini page loaded successfully!");

    // Get text from div.gb_g
    const elementText = await page.$eval("div.gb_g", (el) => el.textContent);
    console.log("div.gb_g text:", elementText);

    // Save cookies to file
    const cookies = await page.cookies();
    const cookiesDir = path.join(process.cwd(), "cookies");
    await fs.ensureDir(cookiesDir);
    await fs.writeJson(path.join(cookiesDir, "gemini.json"), cookies, { spaces: 2 });
    console.log("✅ Cookies saved to cookies/gemini.json");

    // Close page
    await page.close();

    console.log("✅ Page closed!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await closeBrowser();
    console.log("✅ Browser closed!");
  }
}

// Run test
testGemini();
