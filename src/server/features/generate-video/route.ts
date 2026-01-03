import express from "express";
import multer from "multer";
import { generateVideo } from "./generate-video";
import { authenticateToken } from "../auth/auth";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", authenticateToken, upload.single("image"), async (req, res) => {
    try {
        const { prompt } = req.body;
        const imageBuffer = req.file?.buffer;
        if (!imageBuffer || !prompt) {
            return res.status(400).json({ error: "Image and prompt are required" });
        }

        const videoBase64 = await generateVideo(imageBuffer, prompt);
        res.json({ video: videoBase64 });
    } catch (error) {
        console.error(error);
        const errorResponse: { error: string; screenshot?: string } = {
            error: error instanceof Object && "error" in error ? (error as any).error : "Failed to generate video",
        };
        if (error instanceof Object && "screenshot" in error && (error as any).screenshot) {
            errorResponse.screenshot = (error as any).screenshot;
        }
        res.status(500).json(errorResponse);
    }
});

export default router;
