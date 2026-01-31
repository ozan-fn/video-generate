import { Router } from "express";
import { getHealth, getInfo } from "../controllers/generateController";
import { generateVideo } from "../controllers/videoController";
import { checkLogin } from "../controllers/loginController";
import { upload } from "../config/multer";

const router = Router();

// Health check
router.get("/health", getHealth);

// API info
router.get("/", getInfo);

// Check login status
router.get("/check-login", checkLogin);

// Generate video
router.post("/generate", upload.array("images", 5), generateVideo);
// Generate video (alias)
router.post("/generate-video", upload.array("images", 5), generateVideo);

export default router;
