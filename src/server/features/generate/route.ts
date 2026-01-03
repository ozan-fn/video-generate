import express from "express";
import { generateImage } from "./generate.js";
import { authenticateToken } from "../auth/auth.js";

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
    try {
        const { prompt, images } = req.body; // images: string[] base64

        if (!prompt || !images || !Array.isArray(images)) {
            return res.status(400).json({ error: "Prompt and images are required" });
        }

        const base64 = await generateImage(prompt, images);

        res.json({ image: base64 });
    } catch (error) {
        console.error(error);
        const errorResponse: { error: string; screenshot?: string } = {
            error: error instanceof Object && "error" in error ? (error as any).error : "Generation failed",
        };
        if (error instanceof Object && "screenshot" in error && (error as any).screenshot) {
            errorResponse.screenshot = (error as any).screenshot;
        }
        res.status(500).json(errorResponse);
    }
});

export default router;
