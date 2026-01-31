import { Router } from "express";
import { getHealth, getInfo, generateVideo } from "../controllers/generateController";
import { upload } from "../config/multer";

const router = Router();

// Health check
router.get("/health", getHealth);

// API info
router.get("/", getInfo);

// Generate video
router.post("/generate", upload.array("images", 2), generateVideo);

export default router;
