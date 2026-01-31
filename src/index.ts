import { getBrowser, } from "./lib/browser";

async function main() {
    const browser = await getBrowser()
    const page = await browser.newPage();
    await page.goto("https://example.com");
    const pageTitle = await page.title();
    browser.close()
    console.log(pageTitle)
}

main()