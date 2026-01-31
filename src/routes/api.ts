import { Router } from "express";
import { getHealth, getInfo } from "../controllers/generateController";
import { generateVideo, generateVideoWithPreviousFrame } from "../controllers/videoController";
import { checkLogin } from "../controllers/loginController";
import { upload } from "../config/multer";

const router = Router();

// Health check
router.get("/health", getHealth);

// API info
router.get("/", getInfo);

// Check login status
router.get("/check-login", checkLogin);

// Generate video from images
router.post("/generate", upload.array("images", 5), generateVideo);
router.post("/generate-video", upload.array("images", 5), generateVideo);

// Generate video with previous frame + prompt
router.post("/generate-video-continue", generateVideoWithPreviousFrame);

export default router;
