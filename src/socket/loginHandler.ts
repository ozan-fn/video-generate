import { Socket } from "socket.io";
import { newPage } from "../lib/browser";

const userState = new Map<string, string>();
const userPages = new Map<string, any>();
const userIntervals = new Map<string, NodeJS.Timeout>();

export default async function loginHandler(socket: Socket) {
    userState.set(socket.id, "login");

    socket.on("login", async (msg) => {
        const page = await newPage();

        userPages.set(socket.id, page);

        const interval = setInterval(async () => {
            const base64 = await page.screenshot({ type: "webp", encoding: "base64" });
            socket.emit("screenshot", base64);
        }, 2000);
        userIntervals.set(socket.id, interval);

        await page.goto("https://gemini.google.com/?hl=en", { waitUntil: "domcontentloaded" });

        await page.waitForNavigation();
        await Promise.all([
            page.waitForNavigation(), //
            page.click("text=Sign in"),
        ]);

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
            userIntervals.delete(socket.id);
            await page.close();
            userPages.delete(socket.id);
        }
    });

    socket.on("disconnect", async () => {
        const page = userPages.get(socket.id);
        const interval = userIntervals.get(socket.id);

        if (interval) {
            clearInterval(interval);
            userIntervals.delete(socket.id);
        }

        if (page) {
            await page.close();
            userPages.delete(socket.id);
        }

        userState.delete(socket.id);
        console.log(`Socket ${socket.id} disconnected and cleaned up`);
    });
}
