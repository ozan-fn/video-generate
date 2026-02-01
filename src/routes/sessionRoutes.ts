import { Router } from "express";
import { createSession, getSession } from "../controllers/sessionController";

const router = Router();

// create session
router.post("/", createSession);
router.get("/:id", getSession);

export default router;
