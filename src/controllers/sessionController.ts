import { Request, Response } from "express";
import { Page } from "puppeteer-core";
import { getBrowser } from "../lib/browser";

interface SessionData {
    id: string;
    page: Page;
    cookies: Record<string, string>[];
    status: "idle" | "processing" | "done";
}

const sessions: SessionData[] = [];

export const createSession = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
    }
    const context = await (await getBrowser()).createBrowserContext();

    let session: SessionData = {
        id: email,
        page: await context.newPage(),
        cookies: [],
        status: "idle",
    };
    sessions.push(session);
    setTimeout(async () => {
        sessions.find((s) => s.id === session.id)!.status = "processing";
        await session.page.goto("https://gemini.google.com/app?hl=en", { waitUntil: "networkidle2" });
        await session.page.click("text=Sign in");
        await session.page.waitForSelector('input[type="email"]', { visible: true });
        await session.page.type('input[type="email"]', email);
        await session.page.keyboard.press("Enter");
        await session.page.waitForNavigation();
        await session.page.waitForSelector('input[type="password"]', { visible: true });
        await session.page.type('input[type="password"]', password);
        await session.page.keyboard.press("Enter");
        await session.page.waitForNavigation();
        if (session.page.url().includes("gemini.google.com")) {
            sessions.find((s) => s.id === session.id)!.status = "done";
        } else {
            sessions.find((s) => s.id === session.id)!.status = "idle";
        }
    }, 0);

    res.status(201).json({ message: "Session created" });
};

export const getSessions = (req: Request, res: Response) => {
    res.status(200).json(sessions.map(({ id, status }) => ({ id, status })));
};

export const getSession = async (req: Request, res: Response) => {
    const { id } = req.params;
    const session = sessions.find((s) => s.id === id);
    const ss = await session?.page.screenshot({ encoding: "base64" });
    if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
    }
    res.status(200).json({ ...session, screenshot: `data:image/png;base64,${ss}` });
};

export const deleteSession = async (req: Request, res: Response) => {
    const { id } = req.params;
    const sessionIndex = sessions.findIndex((s) => s.id === id);
    if (sessionIndex === -1) {
        res.status(404).json({ error: "Session not found" });
        return;
    }
    await sessions[sessionIndex].page.browserContext().close();
    sessions.splice(sessionIndex, 1);
    res.status(200).json({ message: "Session deleted" });
};

export const clickButtonInSession = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { buttonText } = req.body;
    const session = sessions.find((s) => s.id === id);
    if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
    }
    try {
        await session.page.click(`text=${buttonText}`);
        res.status(200).json({ message: "Button clicked" });
    } catch (error) {
        res.status(500).json({ error: "Failed to click button" });
    }
};
