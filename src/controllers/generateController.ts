import { Request, Response } from "express";
import { imageService } from "../services/imageService";

export const getHealth = (req: Request, res: Response) => {
  res.json({ status: "ok" });
};

export const getInfo = (req: Request, res: Response) => {
  res.json({ message: "Video Generate API Server" });
};

export const generateVideo = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    const files = req.files as Express.Multer.File[];

    // Validation
    if (!files || files.length !== 2) {
      return res.status(400).json({
        error: "Exactly 2 image files are required",
      });
    }

    if (!prompt) {
      return res.status(400).json({
        error: "Prompt is required",
      });
    }

    // Process with Gemini
    const base64 = await imageService.processWithGemini({
      image1Buffer: files[0].buffer,
      image2Buffer: files[1].buffer,
      image1Name: files[0].originalname,
      image2Name: files[1].originalname,
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
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
