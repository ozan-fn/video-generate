import { Router } from "express";
import { getHealth, getInfo, generateVideo } from "../controllers/generateController";
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
router.post("/generate", upload.array("images", 2), generateVideo);

export default router;
