import { getBrowser } from "./lib/browser";
import "./server"; // Start Express server

// Original main function
async function main() {
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.goto("chrome://gpu");
  await page.screenshot({ path: "gpu_debug.png", fullPage: true });
  browser.close();
}
