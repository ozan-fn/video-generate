import { getBrowser, closeBrowser } from "../lib/browser";

async function testGemini() {
  console.log("Opening Gemini...");

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();

    // Buka halaman Gemini
    await page.goto("https://gemini.google.com/?hl=en", {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    console.log("✅ Gemini page loaded successfully!");

    // Close page
    // await page.close();

    console.log("✅ Page closed!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    // await closeBrowser();
    console.log("✅ Browser closed!");
  }
}

// Run test
testGemini();
