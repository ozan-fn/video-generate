import express from "express";
import multer from "multer";
import { generateVideo } from "./generate-video";
import { authenticateToken } from "../auth/auth";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", authenticateToken, upload.single("image"), async (req, res) => {
    try {
        const { prompt } = req.body;
        const imagePath = req.file?.path;
        if (!imagePath || !prompt) {
            return res.status(400).json({ error: "Image and prompt are required" });
        }

        const videoBase64 = await generateVideo(imagePath, prompt);
        res.json({ video: videoBase64 });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate video" });
    }
});

export default router;
