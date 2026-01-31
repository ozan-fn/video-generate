import { Request, Response } from "express";
import { videoService } from "../services/videoService";

export const generateVideo = async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;
        const files = req.files as Express.Multer.File[];

        if (!files || files.length < 1 || files.length > 5) {
            return res.status(400).json({
                error: "Please upload between 1 and 5 images",
            });
        }

        if (!prompt) {
            return res.status(400).json({
                error: "Prompt is required",
            });
        }

        const result = await videoService.generateFromImages({
            prompt,
            files,
        });

        res.json({
            message: "Video generated successfully",
            image: `data:image/png;base64`,
            images: "result.images",
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
