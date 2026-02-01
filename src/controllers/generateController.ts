import { Request, Response } from "express";
import { imageService } from "../services/imageService";

export const getHealth = (req: Request, res: Response) => {
    res.json({ status: "ok" });
};

export const getInfo = (req: Request, res: Response) => {
    res.json({ message: "Video Generate API Server" });
};

export const generate = async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;
        const files = req.files as Express.Multer.File[];

        // Validation
        if (!files || files.length < 1 || files.length > 5) {
            return res.status(400).json({
                error: "Between 1 and 5 image files are required",
            });
        }

        if (!prompt) {
            return res.status(400).json({
                error: "Prompt is required",
            });
        }

        // Process with Gemini
        const base64 = await imageService.processWithGemini({
            imageBuffers: files.map((f) => f.buffer),
            imageNames: files.map((f) => f.originalname),
            prompt,
        });

        res.json({
            message: "Image generated successfully",
            image: `data:image/png;base64,${base64}`,
            images: files.map((f) => ({
                name: f.originalname,
                size: f.size,
            })),
        });
    } catch (error) {
        const err = error as Error & { screenshot?: string };
        if (err?.screenshot) {
            return res.status(500).json({
                error: err.message || "Gemini processing failed",
                screenshot: `data:image/png;base64,${err.screenshot}`,
            });
        }

        res.status(500).json({
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const generateVideo = async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;
        const files = req.files as Express.Multer.File[];

        // Validation
        if (!files || files.length < 1 || files.length > 5) {
            return res.status(400).json({
                error: "Between 1 and 5 image files are required",
            });
        }

        if (!prompt) {
            return res.status(400).json({
                error: "Prompt is required",
            });
        }

        // Process with Gemini
        const base64 = await imageService.processWithGemini({
            imageBuffers: files.map((f) => f.buffer),
            imageNames: files.map((f) => f.originalname),
            prompt,
        });

        res.json({
            message: "Video generated successfully",
            image: `data:image/png;base64,${base64}`,
            images: files.map((f) => ({
                name: f.originalname,
                size: f.size,
            })),
        });
    } catch (error) {
        const err = error as Error & { screenshot?: string };
        if (err?.screenshot) {
            return res.status(500).json({
                error: err.message || "Gemini processing failed",
                screenshot: `data:image/png;base64,${err.screenshot}`,
            });
        }

        res.status(500).json({
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
