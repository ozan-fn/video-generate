import { getBrowser, closeBrowser } from "../lib/browser";

async function testGemini() {
  console.log("Opening Gemini...");

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();

    // Buka halaman Gemini
    await page.goto("https://gemini.google.com/?hl=en", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    console.log("✅ Gemini page loaded successfully!");

    // Get text from div.gb_g
    const elementText = await page.$eval("div.gb_g", (el) => el.textContent);
    console.log("div.gb_g text:", elementText);

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
