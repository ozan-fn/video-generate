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
        res.status(500).json({ error: "Generation failed" });
    }
});

export default router;
