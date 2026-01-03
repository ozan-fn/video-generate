import { getBrowser } from "../shared/browser";
import fs from "fs";

(async () => {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await await page.goto("https://grok.com");

    if (await page.$('a[href="/sign-in"]')) {
        await page.click('a[href="/sign-in"]');
    }

    await page.waitForSelector("textarea", { timeout: 0, visible: true });

    const cookies = await page.cookies();
    fs.writeFileSync("./cookies-grok.json", JSON.stringify(cookies, null, 2));

    await browser.close();
})();
