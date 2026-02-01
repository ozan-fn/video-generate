import { Router } from "express";
import { getHealth, getInfo, generate } from "../controllers/generateController";
import { generateVideo, generateVideoWithPreviousFrame } from "../controllers/videoController";
import { checkLogin } from "../controllers/loginController";
import { upload } from "../config/multer";
import path from "path";
import fs from "fs-extra";

const router = Router();

// Health check
router.get("/health", getHealth);

// API info
router.get("/", getInfo);

// Check login status
router.get("/check-login", checkLogin);

// Generate video from images
router.post("/generate", upload.array("images", 5), generate);
router.post("/generate-video", upload.array("images", 5), generateVideo);

// Generate video with previous frame + prompt
router.post("/generate-video-continue", generateVideoWithPreviousFrame);

// Get all generated videos
router.get("/videos", async (req, res) => {
    try {
        const storageDir = path.join(process.cwd(), "storages");
        if (!(await fs.pathExists(storageDir))) {
            return res.json({ videos: [] });
        }

        const files = await fs.readdir(storageDir);
        const videoFiles = files.filter((file) => file.endsWith(".mp4"));

        const videos = await Promise.all(
            videoFiles.map(async (file) => {
                const filePath = path.join(storageDir, file);
                const stats = await fs.stat(filePath);
                return {
                    name: file,
                    size: stats.size,
                    createdAt: stats.birthtime.toISOString(),
                };
            }),
        );

        // Sort by creation date descending
        videos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        res.json({ videos });
    } catch (error) {
        console.error("Error reading videos:", error);
        res.status(500).json({ error: "Failed to read videos" });
    }
});

// Delete a video
router.delete("/videos/:filename", async (req, res) => {
    try {
        const filename = req.params.filename;

        // Validate filename (prevent directory traversal)
        if (filename.includes("..") || filename.includes("/")) {
            return res.status(400).json({ error: "Invalid filename" });
        }

        const filePath = path.join(process.cwd(), "storages", filename);

        // Check if file exists
        if (!(await fs.pathExists(filePath))) {
            return res.status(404).json({ error: "Video not found" });
        }

        // Delete the file
        await fs.remove(filePath);
        res.json({ message: "Video deleted successfully" });
    } catch (error) {
        console.error("Error deleting video:", error);
        res.status(500).json({ error: "Failed to delete video" });
    }
});

export default router;
