import { Socket } from "socket.io";
import { newPage } from "../lib/browser";

const userState = new Map<string, string>();

export default async function loginHandler(socket: Socket) {
    userState.set(socket.id, "login");

    socket.on("login", async (msg) => {
        const page = await newPage();

        const interval = setInterval(async () => {
            const base64 = await page.screenshot({ type: "webp", encoding: "base64" });
            socket.emit("screenshot", base64);
        }, 2000);

        await page.goto("https://gemini.google.com/?hl=en", { waitUntil: "domcontentloaded" });
        await page.click("text=Sign in");
        await page.waitForNavigation();

        const state = userState.get(socket.id);
        console.log(msg);
        if (state === "login") {
            const [email, password] = msg.split("|");

            if (await page.$(`div[data-identifier="${email}"]`)) {
                await page.click(`div[data-identifier="${email}"]`);
                await page.type('input[type="password"]', password);
                await page.keyboard.press("Enter");

                userState.set(socket.id, "verification");
            } else {
                await page.type('input[type="email"]', email);
                await page.keyboard.press("Enter");
                await page.waitForSelector('input[type="password"]', { visible: true });
                await page.type('input[type="password"]', password);
                await page.keyboard.press("Enter");

                userState.set(socket.id, "verification");
            }
        } else if (state === "verification") {
            socket.emit("result", `Umur kamu ${msg} tahun, noted.`);
            userState.delete(socket.id);
            clearInterval(interval);
            await page.close();
        }
    });
}
