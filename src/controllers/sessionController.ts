import { Request, Response } from 'express';
import { Page } from 'puppeteer-core';
import { getBrowser } from '../lib/browser';
import { Session } from '../models/Session';

interface SessionData {
    id: string;
    page: Page;
    cookies: any[];
    status: 'idle' | 'processing' | 'done' | 'error';
}

const sessions: SessionData[] = [];

export const createSession = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
    }

    const isDuplicate = sessions.find((s) => s.id === email);
    if (isDuplicate) {
        res.status(409).json({ error: 'Session for this email is already being processed' });
        return;
    }

    const browser = await getBrowser();
    const context = await browser.createBrowserContext();
    const page = await context.newPage();

    let session: SessionData = {
        id: email,
        page: page,
        cookies: [],
        status: 'idle',
    };

    sessions.push(session);

    setTimeout(async () => {
        try {
            const currentSession = sessions.find((s) => s.id === session.id);
            if (currentSession) currentSession.status = 'processing';

            await session.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0');

            await session.page.goto('https://gemini.google.com/app?hl=en', {
                waitUntil: 'networkidle2',
                timeout: 60000,
            });

            await session.page.click('text=Sign in');

            await session.page.waitForSelector('input[type="email"]', { visible: true, timeout: 15000 });
            await session.page.type('input[type="email"]', email);
            await session.page.keyboard.press('Enter');

            await session.page.waitForNavigation({ waitUntil: 'networkidle2' });

            await session.page.waitForSelector('input[type="password"]', { visible: true, timeout: 15000 });
            await session.page.type('input[type="password"]', password);
            await session.page.keyboard.press('Enter');

            await session.page.waitForNavigation({ waitUntil: 'networkidle2' });

            if (session.page.url().includes('gemini.google.com')) {
                const targetSession = sessions.find((s) => s.id === session.id);
                if (targetSession) targetSession.status = 'done';

                const rawCookies = await session.page.cookies();

                // --- LOGIKA UPSERT ---
                // Menggunakan findOneAndUpdate dengan upsert: true agar jika ID ada akan diupdate, jika tidak akan dibuat baru
                await Session.findOneAndUpdate(
                    { id: session.id },
                    {
                        cookies: JSON.stringify(rawCookies),
                        status: 'valid',
                    },
                    { upsert: true, new: true },
                );
            } else {
                const targetSession = sessions.find((s) => s.id === session.id);
                if (targetSession) targetSession.status = 'idle';
            }
        } catch (error) {
            console.error(`Error in session ${email}:`, error);
            const targetSession = sessions.find((s) => s.id === session.id);
            if (targetSession) targetSession.status = 'error';
        } finally {
            const sessionIndex = sessions.findIndex((s) => s.id === session.id);
            if (sessionIndex !== -1) {
                sessions.splice(sessionIndex, 1);
            }

            try {
                if (!session.page.isClosed()) {
                    await session.page.close();
                }
                await context.close();
            } catch (closeError) {
                console.error('Error during cleanup:', closeError);
            }
        }
    }, 0);

    res.status(201).json({ message: 'Session creation initiated' });
};

export const getSessions = async (req: Request, res: Response) => {
    try {
        const sessions1 = await Session.find({}, { id: 1, status: 1 });
        let sessionss = await Promise.all(
            sessions.map(async (session) => {
                const ss = await session.page.screenshot({ encoding: 'base64' });
                return { ...session, screenshot: `data:image/png;base64,${ss}` };
            }),
        );
        res.status(200).json({ sessions: sessionss, sessionList: sessions1 });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
};

export const getSession = async (req: Request, res: Response) => {
    const { id } = req.params;
    const session = sessions.find((s) => s.id === id);
    if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }
    const ss = await session.page.screenshot({ encoding: 'base64' });
    res.status(200).json({ ...session, screenshot: `data:image/png;base64,${ss}` });
};

export const deleteSession = async (req: Request, res: Response) => {
    const { id } = req.params;
    const sessionIndex = sessions.findIndex((s) => s.id === id);
    if (sessionIndex === -1) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }
    await sessions[sessionIndex].page.browserContext().close();
    sessions.splice(sessionIndex, 1);
    res.status(200).json({ message: 'Session deleted' });
};

export const clickButtonInSession = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { buttonText } = req.body;
    const session = sessions.find((s) => s.id === id);
    if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }
    try {
        await session.page.click(`text=${buttonText}`);
        if (session.page.url().includes('gemini.google.com')) {
            const rawCookies = await session.page.cookies();

            // --- LOGIKA UPSERT PADA CLICK ---
            await Session.findOneAndUpdate(
                { id: session.id },
                {
                    cookies: JSON.stringify(rawCookies),
                    status: 'valid',
                },
                { upsert: true },
            );
        }
        res.status(200).json({ message: 'Button clicked' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to click button' });
    }
};

export const checkSessionStatus = async (req: Request, res: Response) => {
    let context, page;
    try {
        const id = req.params.id as string;
        const session = await Session.findOne({ id });
        if (!session) return res.status(404).json({ error: 'Session not found' });

        context = await (await getBrowser()).createBrowserContext();
        page = await context.newPage();

        if (session.cookies) {
            try {
                const parsedCookies = typeof session.cookies === 'string' ? JSON.parse(session.cookies) : session.cookies;
                await page.setCookie(...parsedCookies);
            } catch (e) {
                console.error('Error parsing cookies:', e);
            }
        }

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0');
        await page.goto('https://gemini.google.com/app?hl=en', { waitUntil: 'domcontentloaded' });

        const isLogged = await page.$('.gb_g');
        if (!isLogged) {
            const activeSession = sessions.find((s) => s.id === session.id);
            if (activeSession) activeSession.status = 'idle';

            await Session.updateOne({ id }, { status: 'invalid' });
            res.json({ status: 'invalid' });
        } else {
            // --- UPDATE COOKIE SETIAP CHECK ---
            const currentCookies = await page.cookies();
            await Session.updateOne(
                { id },
                {
                    cookies: JSON.stringify(currentCookies),
                    status: 'valid',
                },
            );
            res.json({ status: 'valid' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (page) await page.close().catch(() => {});
        if (context) await context.close().catch(() => {});
    }
};
