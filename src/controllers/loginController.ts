import { Request, Response } from "express";
import { newPage } from "../lib/browser";

export interface CheckLoginQuery {
    platform?: string; // "gemini", "gpt", dll - untuk sementara default gemini
}

export const checkLogin = async (req: Request, res: Response) => {
    let page = null;
    try {
        const { platform = "gemini" } = req.query as CheckLoginQuery;

        // Untuk sementara hanya support gemini
        if (platform !== "gemini") {
            return res.status(400).json({
                error: `Platform "${platform}" tidak didukung saat ini. Gunakan "gemini"`,
                supported: ["gemini"],
            });
        }

        page = await newPage();

        // Buka Gemini dengan language English
        await page.goto("https://gemini.google.com?hl=en", {
            waitUntil: "domcontentloaded",
            timeout: 10000,
        });

        // Cari element dengan selector .gb_g (profile icon area)
        const profileElement = await page.$(".gb_g");

        if (profileElement) {
            // Jika element ada, berarti user sudah login
            res.json({
                platform: "gemini",
                isLoggedIn: true,
                message: "You are logged in to Gemini",
                profileFound: true,
                details: {
                    selector: ".gb_g",
                    elementFound: true,
                    timestamp: new Date().toISOString(),
                },
            });
        } else {
            // Element tidak ditemukan, berarti belum login
            res.json({
                platform: "gemini",
                isLoggedIn: false,
                message: "You are not logged in to Gemini",
                profileFound: false,
                details: {
                    selector: ".gb_g",
                    elementFound: false,
                    action: "Please login to Gemini first at https://gemini.google.com",
                    timestamp: new Date().toISOString(),
                },
            });
        }
    } catch (error) {
        res.status(500).json({
            error: "Failed to check login status",
            details: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString(),
        });
    } finally {
        if (page) {
            await page.close();
        }
    }
};
