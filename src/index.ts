import { getBrowser, } from "./lib/browser";

async function main() {
    const browser = await getBrowser()
    const page = await browser.newPage();
    await page.goto("chrome://gpu");
    await page.screenshot({ path: 'gpu_debug.png', fullPage: true });
    browser.close()
    // console.log(pageTitle)
}

main()